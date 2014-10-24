var config = require('config'),
  express = require('express'),
  app = express(),
  Q = require('q'),
  fs = require('fs-extra'),
  Firebase = require('firebase'),
  firebaseEndpoint = config.get('public.firebase.endpoint'),
  firebaseRoot = new Firebase(firebaseEndpoint),
  firebaseSecret = config.get('private.firebase.secret'),
  winston = require('winston'),
  mime= require('mime'),
  moment = require('moment'),
  _ = require('underscore'),
  expressHandlebars = require('express-handlebars'),
  helpers = require('./lib/helpers.js')({bucket: config.get('public.amazon.publicBucket')}),
  Showdown = require('showdown'),
  mdConverter = new Showdown.converter(),
  ElasticSearchClient = require('elasticsearchclient'),
  elasticSearchClient = new ElasticSearchClient(config.get('private.elasticsearch')),
  elasticSearchIndex = config.get('private.elasticsearch.index'),
  Feed = require('feed'),
  handlebars,
  theme,
  words,
  products,
  settings,
  hashtags,
  wordsIndex,
  noop = function () {},
  setCache = noop,
  htmlDateFormat = "ddd, DD MMM YYYY HH:mm:ss";

/*
 * Templating
*/
app.set('view engine', 'handlebars');

/*
 * Redis
*/
winston.info('Redis enabled: ' + config.get('public.content.redisEnabled'));
if (config.get('public.content.redisEnabled')) {
  var Redis = require('redis'),
    redisTTL = config.get('private.redis.ttl'),
    redis = Redis.createClient(),
    redisOn = false;

  setCache = function (url, data) {
    redis.set(url, data);
    redis.expire(url, redisTTL);
  };


  redis.select(config.get('private.redis.dbIndex'));
  redis.flushdb();


  redis.on('ready', function (e) {
    redisOn = true;
    winston.info('redis ready');
  });

  redis.on('error', function (err) {
    winston.error('redis error', err);
  });

  app.use(function (req, res, next) {
    if (!redisOn) {
      winston.info('redis off');
      next();

    } else {

      var url = req.url,
        parts = url.split('/');

      parts.shift(); // Drop the blank part of the route

      if (parts[0] === 'static') { // set Content-Type for static files.
        res.setHeader('Content-Type', mime.lookup(url.split('?')[0]));
      }

      redis.get(url, function (err, cache) {
        return cache ? res.send(cache) : next();
      });

    }

  });

}

/*
 * Env.js
*/
app.get('/env.js', function (req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send("window.envVars = " + JSON.stringify(config.get('public')) + ";");
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
  res.setHeader('Cache-Control', 'max-age=34536000');
  res.setHeader('Expires', moment().add(5, 'year').format(htmlDateFormat)) + ' GMT';

//  console.log('path', path);
  fs.readFile(path, function (err, data) {
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
  var primaryPostCount = settings.primaryPostCount || 1,
    secondaryPostCount = settings.secondaryPostCount || 4,
    tertiaryPostCount = settings.tertiaryPostCount || 10,
    firstPageCount = primaryPostCount + secondaryPostCount + tertiaryPostCount,
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

      if (length +1 >= firstPageCount) {
        nextPage = Math.ceil((length + 2 - firstPageCount) / tertiaryPostCount);
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
/*
 * RSS 2.0 and Atom 1.0
 */
var getFeed = function () {
  var deferred = Q.defer(),
    searchDeferred = Q.defer(),
    xml;

//  elasticSearchClient.search(elasticSearchIndex, "word",{
//    "query": {
//      "match_all": {}
//    }
//  }, function (err, data) {
//    var data = JSON.parse(data),
//      words = [];
//
//    if (data && data.hits && data.hits.hits) {
//      _.each(data.hits.hits, function (hit) {
//        words.push(hit._source);
//      });
//    } else {
//      err = "Search failed.";
//    }
//
//    words = _.sortBy(words, function (word) {
//      return -1 * word.order;
//    });
//
//    _.each(words, function (word) {
//      console.log(word.order);
//    });
//
//    return err ? searchDeferred.reject(err || data.error) : searchDeferred.resolve(words);
//  });

  searchDeferred.resolve(_.sortBy(words, function (word) {
    return -1 * word.order;
  }));

  searchDeferred.promise.then(function (words) {
    var feedOptions = _.defaults(config.get('public.rss'), {pubDate: new Date()}),
      feed = new Feed(feedOptions),
      root = config.get('public.root');

    _.each(words, function (word) {
      if (word.published) {
        var categories = [],
          item,
          keyImage = word.keyImage,
          markdown = word.published.markdown;

        _.each(word.hashtags, function (hashtag) {
          categories.push(hashtag.key);
        });

        if (keyImage) {
          if (keyImage.Versions && keyImage.Versions.small) {
            keyImage = keyImage.Versions.small;
          }

          markdown = '!['+ (word.keyImage.Name || keyImage.Key) + '](' + helpers.s3(keyImage.Key) + ')\n\n' + markdown;
        }

        item = {
          "title": word.title || "no title",
          "link": root + '/' + word.slug,
          "description": word.excerpt || "no description",
          "date": new Date(word.published.published),
          "guid": word.slug,
          "categories": categories,
          "author": [{
            name: word.author.name,
            email: word.author.email,
            link: word.author.website
          }],
          "content": mdConverter.makeHtml(markdown)

        };

        if (word.location && word.location.key) {
          item.lat = word.location.key.lat;
          item.long = word.location.key.lng;
        }

        feed.addItem(item);

      }

    });

    deferred.resolve(feed);

  }, deferred.reject);

  return deferred.promise;

}
app.get('/atom', function (req, res) {
  getFeed().then(function (feed) {
    var xml = feed.render('atom-1.0');
    res.status(200).send(xml);
    setCache(req.url, xml)
  }, function (err) {
    res.status(500).send(err);
  });
});
app.get('/rss', function (req, res) {
  getFeed().then(function (feed) {
    var xml = feed.render('rss-2.0');
    res.status(200).send(xml);
    setCache(req.url, xml)
  }, function (err) {
    res.status(500).send(err);
  });
});

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
      development: config.get('public.environment') === 'development',
      env: config.get('public'),
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
      development: config.get('public.environment') === 'development',
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
  renderPosts(theme.frontPage || 'front-page', 0, req.url, {title: settings.siteTitle}).then(function (html) {
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
  if (!wordsIndex || !Object.keys(wordsIndex).length) {
    return res.sendStatus(404);
  }

  var slug = req.params.slug,
    key = wordsIndex[slug],
    searchDeferred = Q.defer(),
    url = req.protocol + '://' + req.hostname + req.url;

  elasticSearchClient.search(elasticSearchIndex, "word",{
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
      development: config.get('public.environment') === 'development',
      post: post,
      settings: settings,
      url: req.url,
      slug: slug,
      env: config.get('public')
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

  elasticSearchClient.search(elasticSearchIndex, "word", {"query": {"query_string": {"query": searchTerm}}}, function (err, data) {
    return err ? deferred.reject(err) : deferred.resolve(JSON.parse(data));
  });

  deferred.promise.then(function (data) {
    var hits = data.hits.hits,
      posts = [];

    _.each(hits, function (hit) {
      posts.push(hit._source);
    });

    app.render('posts', {
      development: config.get('public.environment') === 'development',
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
    var deferred = Q.defer(),
      deleteDeferred = Q.defer(),
      commands = [];

    elasticSearchClient.deleteByQuery(elasticSearchIndex, "word", {"match_all": {}}, function (err, data) {
      return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
    });


    deleteDeferred.promise.then(function () {
      _.each(words, function (word, key) {
        if (word.keyImage && !word.keyImage.Versions) {
          word.keyImage.Versions = {}; // This prevents a mapping error in elasticsearch. It doesn't like "keyImage.Versions: false"
        }
        commands.push({"index": {"_index": elasticSearchIndex, "_type": "word"}});
        commands.push(word);
      });

      elasticSearchClient.bulk(commands, {})
        .on('data', function (data) {
//          var commands = JSON.parse(data);
//          _.each(commands, console.log);
        })
        .on('done', deferred.resolve)
        .on('error', deferred.reject)
        .exec();
    }, function (err) {
      winston.error('elasticsearch delete', err);
    });

    return deferred.promise;
  };

app.get('/delete', function (req, res) {

});

/*
 * Auth & App Listen
*/
console.log('...Starting auth...');
firebaseRoot.auth(firebaseSecret, function () {
  var themeRef = firebaseRoot.child('theme'),
    wordsRef = firebaseRoot.child('content').child('words'),
    productsRef = firebaseRoot.child('content').child('products'),
    settingsRef = firebaseRoot.child('settings'),
    hashtagsRef = firebaseRoot.child('content').child('hashtags'),
    wordsIndexRef = firebaseRoot.child('wordsIndex'),
    themeDeferred = Q.defer(),
    wordsDeferred = Q.defer(),
    productsDeferred = Q.defer(),
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


  productsRef.on('value', function (snapshot) {
    products = snapshot.val();
    productsDeferred.resolve(products);
  });

  settingsRef.on('value', function (snapshot) {
    var stringChecks =  ['nav1Title', 'nav2Title', 'nav3Title'];
    settings = snapshot.val();

    _.each(stringChecks, function (check) {
      var value = settings[check];
      if (typeof value === 'string' && !value.length) {
        settings[check] = false;
      }
    });

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
    productsDeferred.promise,
    settingsDeferred.promise,
    hashtagsDeferred.promise,
    wordsIndexDeferred.promise
  ]).then(function () {
    winston.info('Serving on port ' + config.get('private.content.port'));
    app.listen(config.get('private.content.port'));
  }, function (err) {
    winston.error('App not listening', err);
  });


});
