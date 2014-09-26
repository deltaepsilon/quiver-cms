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
    res.status(200).send(data);
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
    count = 0,
    posts = [
      []
    ];

  winston.info('Warning! getPaginatedWords is only paginating the front page. The rest of the pages need work.');
  _.each(words, function (word) {
    if (word.published && (posts[0].length < frontPostCount)) {
      posts[0].push(word);
    }
  });

  return posts;
};

/*
 * Routes
*/
app.get('/', function (req, res) {
  var posts = getPaginatedWords()[0];

  app.render('posts', {
    development: envVars.environment === 'development',
    posts: posts,
    settings: settings,
    url: req.url
  }, function (err, html) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(html);

    }
  });

});

app.get('/posts/:page', function (req, res) {
  res.status(200).send(req.params.page);
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
    wordsIndexRef = firebaseRoot.child('wordsIndex');

  themeRef.on('value', function (snapshot) {
    var viewsDir;

    theme = snapshot.val();

    theme.active = theme.options[theme.active || Object.keys(theme.options)[0]];

    viewsDir = './themes/' + theme.active + '/views';

    console.log('handlebarsHelpers', handlebarsHelpers);

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

  });

  wordsRef.on('value', function (snapshot) {
    words = _.sortBy(snapshot.val(), function (word) { // Sort by reverse word.created
      return -1 * moment(word.created).unix();
    });

    createWordsIndex(words);
  });

  settingsRef.on('value', function (snapshot) {
    settings = snapshot.val();
  });

  wordsIndexRef.on('value', function (snapshot) {
    wordsIndex = snapshot.val();
  });

  console.log('Auth successful. Starting app.');
  app.listen(9900);


});

