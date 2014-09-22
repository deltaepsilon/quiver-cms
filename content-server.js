var express = require('express'),
  app = express(),
  fs = require('fs-extra'),
  envVars = require('./env.js'),
  Firebase = require('firebase'),
  firebaseRoot = new Firebase(envVars.firebase),
  firebaseSecret = process.env.QUIVER_CMS_FIREBASE_SECRET,
  winston = require('winston'),
  engines = require('consolidate'),
  handlebars = require('handlebars'),
  theme;

/*
 * Templating
*/
app.set('view engine', 'handlebars');
app.engine('html', engines.handlebars);

/*
 * Static
*/
app.use('/static', function (req, res) {
  var route = ['.', 'themes', theme.active, 'static'],
    parts = req.url.split('/'),
    path;

  parts.shift(); // Drop the blank part of the route

  path = route.concat(parts).join('/');

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
  console.log('theme', theme);
  app.render('index.html', function (err, html) {
    console.log('render html', err, html);
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
  var themeRef = firebaseRoot.child('theme');

  themeRef.on('value', function (snapshot) {
    theme = snapshot.val();

    theme.active = theme.options[theme.active || Object.keys(theme.options)[0]];

    app.set('views', './themes/' + theme.active);

  });

  console.log('Auth successful. Starting app.');
  app.listen(9900);


});

