var express = require('express'),
  app = express(),
  fs = require('fs-extra'),
  envVars = require('./env.js'),
  Firebase = require('firebase'),
  firebaseRoot = new Firebase(envVars.firebase),
  firebaseSecret = process.env.QUIVER_CMS_FIREBASE_SECRET,
  winston = require('winston'),
  mime= require('mime'),
  _ = require('underscore'),
  expressHandlebars = require('express-handlebars'),
  handlebarsHelpers = require('handlebars-helpers'),
  handlebars,
  theme,
  words,
  settings;

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


app.get('/', function (req, res) {
  var posts = [];

  _.each(words, function (word) {
    if (word.published) {
      posts.push(word);
    }
  });

  app.render('posts', {
    development: envVars.environment === 'development',
    posts: posts,
    settings: settings
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
  res.status(200).send(req.params.slug);
});

console.log('Starting auth.');
firebaseRoot.auth(firebaseSecret, function () {
  var themeRef = firebaseRoot.child('theme'),
    wordsRef = firebaseRoot.child('content').child('words'),
    settingsRef = firebaseRoot.child('content').child('settings');

  themeRef.on('value', function (snapshot) {
    var viewsDir;

    theme = snapshot.val();

    theme.active = theme.options[theme.active || Object.keys(theme.options)[0]];

    viewsDir = './themes/' + theme.active + '/views';

    console.log('handlebarsHelpers', handlebarsHelpers);

    handlebars = expressHandlebars.create({
      defaultLayout: 'main',
      layoutsDir: viewsDir + '/layouts',
      partialsDir: viewsDir + '/partials'
    });

    handlebarsHelpers.register(handlebars.handlebars, {marked: {});

    app.engine('html', handlebars.engine);
    app.engine('handlebars', handlebars.engine);

    app.set('views', viewsDir);

  });

  wordsRef.on('value', function (snapshot) {
    words = snapshot.val();
  });

  settingsRef.on('value', function (snapshot) {
    settings = snapshot.val();
  });

  console.log('Auth successful. Starting app.');
  app.listen(9900);


});

