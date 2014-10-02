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
  helpers = require('./lib/helpers.js'),
  redisTTL = process.env.QUIVER_CMS_REDIS_TTL || 3600,
  handlebars,
  theme,
  words,
  settings,
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
 * Static
*/
app.use('/static', function (req, res) {
  var route = ['.', 'themes', theme.active, 'static'],
    parts = req.url.split('/'),
    path;

  parts.shift(); // Drop the blank part of the route

  path = route.concat(parts).join('/');
  path = path.split('?')[0]; // Drop query strings
  res.setHeader('Content-Type', mime.lookup(path));

//  console.log('path', path);
  fs.readFile(path, 'utf8', function (err, data) {
    var url = '/static' + req.url;
    res.status(200).send(data);

    setCache(url, data);

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
var renderPosts = function (page, url, options) {
  var deferred = Q.defer(),
    page = parseInt(page),
    paginated = getPaginatedWords(),
    posts = paginated[page],
    nextPage = paginated[page + 1] ? page + 1 : null,
    prevPage = page > 0 ? page - 1 : null,
    title = (settings.siteTitle || url)  + ': Posts: ' + page,
    context;

  if (prevPage === 0) {
    prevPage = '0';
  }

  context = {
    development: envVars.environment === 'development',
    posts: posts,
    settings: settings,
    url: url,
    nextPage: nextPage,
    prevPage: prevPage,
    title: title
  };

  app.render('posts', _.defaults(options || {}, context), function (err, html) {
    return err ? deferred.reject(err) : deferred.resolve(html);
  });

  deferred.promise.then(function (html) { // Set cache
    setCache(url, html);
  });

  return deferred.promise;
}
app.get('/', function (req, res) {
  renderPosts(0, req.url, {title: settings.siteTitle}).then(function (html) {
    res.status(200).send(html);
  }, function (err) {
    res.status(500).send(err);
  });

});

app.get('/posts/:page', function (req, res) {
  renderPosts(req.params.page, req.url).then(function (html) {
    res.status(200).send(html);
  }, function (err) {
    res.status(500).send(err);
  });

});

app.get('/:slug', function (req, res) {
  var slug = req.params.slug,
    key = wordsIndex[slug],
    post = words[key];

  app.render('page', {
    development: envVars.environment === 'development',
    post: post,
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

/*
 * Index Words
*/
var createWordsIndex = function (words) {
  var deferred = Q.defer(),
    wordsIndexRef = firebaseRoot.child('wordsIndex'),
    index = {};

  _.each(words, function (word, key) {
    index[word.slug] = key;
  });

  wordsIndexRef.set(index, function (err) {
    return err ? deferred.reject(err) : deferred.resolve();
  });

  return deferred.promise;
};

/*
 * Auth & App Listen
*/
console.log('Starting auth.');
firebaseRoot.auth(firebaseSecret, function () {
  var themeRef = firebaseRoot.child('theme'),
    wordsRef = firebaseRoot.child('content').child('words'),
    settingsRef = firebaseRoot.child('settings'),
    wordsIndexRef = firebaseRoot.child('wordsIndex'),
    themeDeferred = Q.defer(),
    wordsDeferred = Q.defer(),
    settingsDeferred = Q.defer(),
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

    handlebarsHelpers.register(handlebars.handlebars, {marked: {}});

    app.engine('html', handlebars.engine);
    app.engine('handlebars', handlebars.engine);

    app.set('views', viewsDir);

    themeDeferred.resolve(theme);

  });

  wordsRef.on('value', function (snapshot) {
    words = _.sortBy(snapshot.val(), function (word) { // Sort by reverse word.created
      return -1 * moment(word.created).unix();
    });

    createWordsIndex(words);

    wordsDeferred.resolve(words);
  });

  settingsRef.on('value', function (snapshot) {
    settings = snapshot.val();
    settingsDeferred.resolve(settings);
  });

  wordsIndexRef.on('value', function (snapshot) {
    wordsIndex = snapshot.val();
    wordsIndexDeferred.resolve(wordsIndex);
  });

  Q.all([
    themeDeferred.promise,
    wordsDeferred.promise,
    settingsDeferred.promise,
    wordsIndexDeferred.promise
  ]).then(function () {
    winston.info('app listening on 9900');
    app.listen(9900);
  }, function (err) {
    winston.error('App not listening', err);
  });




});

