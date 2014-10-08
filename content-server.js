var express = require('express'),
  app = express(),
  Q = require('q'),
  fs = require('fs-extra'),
  envVars = require('./env.js'),
  Firebase = require('firebase'),
  firebaseRoot = new Firebase(envVars.firebase),
  firebaseSecret = process.env.QUIVER_CMS_FIREBASE_SECRET,
  winston = require('winston'),
  mime= require('mime'),
  moment = require('moment'),
  _ = require('underscore'),
  expressHandlebars = require('express-handlebars'),
  handlebarsHelpers = require('handlebars-helpers'),
  helpers = require('./lib/helpers.js')({bucket: process.env.AMAZON_CMS_PUBLIC_BUCKET}),
  redisTTL = process.env.QUIVER_CMS_REDIS_TTL || 3600,
  ElasticSearchClient = require('elasticsearchclient'),
  elasticSearchClient = new ElasticSearchClient({host: '127.0.0.1', port: 9200}),
  handlebars,
  theme,
  words,
  settings,
  hashtags,
  wordsIndex;

/*
 * Templating
*/
app.set('view engine', 'handlebars');

/*
 * Redis
*/
var Redis = require('redis'),
  redis = Redis.createClient(),
  redisOn = false,
  setCache = function (url, data) {
    redis.set(url, data);
    redis.expire(url, redisTTL);
  };

redis.select(process.env.QUIVER_CMS_REDIS_DB_INDEX || 0);
redis.flushdb();


redis.on('ready', function (e) {
  redisOn = true;
  winston.info('redis ready');
});

redis.on('error', function (err) {
  winston.error('redis error', err);
});

//app.use(function (req, res, next) {
//  if (!redisOn) {
//    winston.info('redis off');
//    next();
//
//  } else {
//
//    var url = req.url,
//      parts = url.split('/');
//
//    parts.shift(); // Drop the blank part of the route
//
//    if (parts[0] === 'static') { // set Content-Type for static files.
//      res.setHeader('Content-Type', mime.lookup(url.split('?')[0]));
//    }
//
//    redis.get(url, function (err, cache) {
//      return cache ? res.send(cache) : next();
//    });
//
//  }
//
//});

/*
 * Env.js
*/
app.get('/env.js', function (req, res) {
  res.status(200).send("window.envVars = " + JSON.stringify(envVars) + ";");
});

/*
 * Static
*/
app.use('/static', function (req, res) {
  var deferred = Q.defer(),
    route = ['.', 'themes', theme.active, 'static'],
    parts = req.url.split('/'),
    path;

  parts.shift(); // Drop the blank part of the route

  path = route.concat(parts).join('/');
  path = path.split('?')[0]; // Drop query strings
  res.setHeader('Content-Type', mime.lookup(path));

//  console.log('path', path);
  fs.readFile(path, 'utf8', function (err, data) {
    return err ? deferred.reject(err) : deferred.resolve(data);
  });

  deferred.promise.then(function (data) {
    res.status(200).send(data);
    setCache('/static' + req.url, data);
  }, function (err) {
    res.sendStatus(404);
  });

});



/*
 * Winston
*/
winston.add(winston.transports.File, { filename: './logs/quiver-cms-content.log'});

/*
 * Words
*/
var getPaginatedWords = function () {
  var frontPostCount = settings.frontPostCount || 5,
    secondaryPostCount = settings.secondaryPostCount || 5,
    posts = [],
    getPostsLength = function () {
      var length = 0,
        i = posts.length;
      while (i--) {
        length += posts[i].length;
      }
      return length;
    };

  words = _.sortBy(words, function (word) {
    return -1 * word.order;
  });

  _.each(words, function (word) {
    if (word.published && word.type === 'post') {
      var length = getPostsLength(),
        nextPage = 0;

      if (length + 1 > frontPostCount) {
        nextPage = Math.ceil((length + 1 - frontPostCount) / secondaryPostCount);
      }

      if (!posts[nextPage]) {
        posts[nextPage] = [];
      }

      posts[nextPage].push(word);
    }

  });

  return posts;
};

/*
 * Routes
*/
var renderPosts = function (template, page, url, options) {
    var deferred = Q.defer(),
      page = parseInt(page),
      paginated = getPaginatedWords(),
      posts = paginated[page],
      nextPage = paginated[page + 1] ? page + 1 : null,
      prevPage = page > 0 ? page - 1 : null,
      title = (settings.siteTitle || url)  + ': Posts: ' + page,
      primaryMax = settings.primaryPostCount || 1,
      secondaryMax = (settings.secondaryPostCount || 4) + primaryMax,
      tertiaryMax = (settings.tertiaryPostCount || 10) | secondaryMax,
      postBlocks = {
        primary: [],
        secondary: [],
        tertiary: [],
        extras: []
      },
      counter = 0,
      context;

    if (prevPage === 0) {
      prevPage = '0';
    }

    // Create post blocks
    _.each(posts, function (post) {
      counter += 1;
      if (counter <= primaryMax) {
        post.postBlock = 'primary';
        postBlocks.primary.push(post);
      } else if (counter <= secondaryMax) {
        post.postBlock = 'secondary';
        postBlocks.secondary.push(post);
      } else if (counter <= tertiaryMax) {
        post.postBlock = 'tertiary';
        postBlocks.tertiary.push(post);
      } else {
        post.postBlock = 'extras';
        postBlocks.extras.push(post);
      }
    });

    context = {
      development: envVars.environment === 'development',
      env: envVars,
      posts: posts,
      postBlocks: postBlocks,
      settings: settings,
      hashtags: hashtags,
      url: url,
      nextPage: nextPage,
      prevPage: prevPage,
      title: title
    };

    app.render(template, _.defaults(options || {}, context), function (err, html) {
      return err ? deferred.reject(err) : deferred.resolve(html);
    });

    deferred.promise.then(function (html) { // Set cache
      setCache(url, html);
    });

    return deferred.promise;
  },
  render404 = function (res, err) {
    app.render('404', {
      development: envVars.environment === 'development',
      settings: settings,
      error: err
    }, function (err, html) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(404).send(html);
      }
    });
  };
app.get('/', function (req, res) {
  renderPosts('front-page', 0, req.url, {title: settings.siteTitle}).then(function (html) {
    res.status(200).send(html);
  }, function (err) {
    res.status(500).send(err);
  });

});

app.get('/posts/:page', function (req, res) {
  renderPosts('posts', req.params.page, req.url).then(function (html) {
    res.status(200).send(html);
  }, function (err) {
    res.status(500).send(err);
  });

});

app.get('/:slug', function (req, res) {
  var slug = req.params.slug,
    key = wordsIndex[slug],
    searchDeferred = Q.defer(),
    url = req.protocol + '://' + req.hostname + req.url;

  elasticSearchClient.search("cms", "word",{
    "query": {
      "match": {
        "key": key
      }
    }
  }, function (err, data) {
    var data = JSON.parse(data),
      post;

    if (data && data.hits && data.hits.hits && data.hits.hits[0] && data.hits.hits[0]._source) {

      post = data.hits.hits[0]._source;
      post.url = url;
    } else {
      err = " Not Found: " + slug;
    }
    return err ? searchDeferred.reject(err || data.error) : searchDeferred.resolve(post);
  });

  searchDeferred.promise.then(function (post) {
    app.render('page', {
      development: envVars.environment === 'development',
      post: post,
      settings: settings,
      url: req.url,
      slug: slug,
      env: envVars
    }, function (err, html) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(html);
        setCache(req.url, html);

      }
    });
  }, function (err) {
    winston.error(404, err);
    render404(res, err);
  });



});

app.get('/search/:searchTerm', function (req, res) {
  var deferred = Q.defer(),
    searchTerm = req.params.searchTerm;

  elasticSearchClient.search("cms", "word", {"query": {"query_string": {"query": searchTerm}}}, function (err, data) {
    return err ? deferred.reject(err) : deferred.resolve(JSON.parse(data));
  });

  deferred.promise.then(function (data) {
    var hits = data.hits.hits,
      posts = [];

    _.each(hits, function (hit) {
      posts.push(hit._source);
    });

    app.render('posts', {
      development: envVars.environment === 'development',
      title: "Search: " + searchTerm,
      posts: posts,
      settings: settings,
      url: req.url
    }, function (err, html) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(html);
        setCache(req.url, html);

      }
    });


  });
});

/*
 * Index Words and Search
*/
var createWordsIndex = function (words) {
    var deferred = Q.defer(),
      wordsIndexRef = firebaseRoot.child('wordsIndex'),
      index = {};

    _.each(words, function (word) {
      index[word.slug] = word.key;
    });

    wordsIndexRef.set(index, function (err) {
      return err ? deferred.reject(err) : deferred.resolve();
    });

    return deferred.promise;
  },
  createSearchIndex = function (words) {
    console.log('creatingSearchIndex');
    var deferred = Q.defer(),
      deleteDeferred = Q.defer(),
      commands = [];

    elasticSearchClient.deleteByQuery("cms", "word", {"match_all": {}}, function (err, data) {
      return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
    });

    deleteDeferred.promise.then(function () {
      _.each(words, function (word, key) {
        commands.push({"index": {"_index": "cms", "_type": "word"}});
        commands.push(word);
      });

      console.log("command count:", Object.keys(words).length, commands.length);
      elasticSearchClient.bulk(commands, {})
        .on('data', function (data) {
//        console.log(data);
        })
        .on('done', deferred.resolve)
        .on('error', deferred.reject)
        .exec();
    });



    return deferred.promise;
  };

app.get('/delete', function (req, res) {

});

/*
 * Auth & App Listen
*/
console.log('Starting auth.');
firebaseRoot.auth(firebaseSecret, function () {
  var themeRef = firebaseRoot.child('theme'),
    wordsRef = firebaseRoot.child('content').child('words'),
    settingsRef = firebaseRoot.child('settings'),
    hashtagsRef = firebaseRoot.child('content').child('hashtags'),
    wordsIndexRef = firebaseRoot.child('wordsIndex'),
    themeDeferred = Q.defer(),
    wordsDeferred = Q.defer(),
    settingsDeferred = Q.defer(),
    hashtagsDeferred = Q.defer(),
    wordsIndexDeferred = Q.defer();

  themeRef.on('value', function (snapshot) {
    var viewsDir;

    theme = snapshot.val();

    theme.active = theme.options[theme.active || Object.keys(theme.options)[0]];

    viewsDir = './themes/' + theme.active + '/views';

    handlebars = expressHandlebars.create({
      defaultLayout: 'main',
      layoutsDir: viewsDir + '/layouts',
      partialsDir: viewsDir + '/partials',
      helpers: helpers
    });

//    handlebarsHelpers.register(handlebars.handlebars, {marked: {}});

    app.engine('html', handlebars.engine);
    app.engine('handlebars', handlebars.engine);

    app.set('views', viewsDir);

    themeDeferred.resolve(theme);

  });

  var handleWords = function (snapshot) {
    var result = [];

    snapshot.forEach(function (wordSnapshot) {
      var word = wordSnapshot.val();
      word.key = wordSnapshot.name();
      result.push(word);
    });

    words = _.sortBy(result, function (word) { // Sort by reverse word.created
      return 1 * moment(word.created).unix();
    });

    Q.all([createWordsIndex(words), createSearchIndex(words)]).then(wordsDeferred.resolve, wordsDeferred.reject);

  };

  wordsRef.on('value', handleWords);

  settingsRef.on('value', function (snapshot) {
    settings = snapshot.val();
    settingsDeferred.resolve(settings);
  });

  hashtagsRef.on('value', function (snapshot) {
    hashtags = snapshot.val();
    hashtagsDeferred.resolve(settings);
  });

  wordsIndexRef.on('value', function (snapshot) {
    wordsIndex = snapshot.val();
    wordsIndexDeferred.resolve(wordsIndex);
  });


  Q.all([
    themeDeferred.promise,
    wordsDeferred.promise,
    settingsDeferred.promise,
    hashtagsDeferred.promise,
    wordsIndexDeferred.promise
  ]).then(function () {
    winston.info('app listening on 9900');
    app.listen(9900);
  }, function (err) {
    winston.error('App not listening', err);
  });




});

