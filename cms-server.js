require('newrelic');
var Q = require('q'),
  _ = require('underscore'),
  express = require('express'),
  app = express(),
  fs = require('fs'),
  AWS = require('aws-sdk'),
  S3 = new AWS.S3(),
  moment = require('moment'),
  Firebase = require('firebase'),
  Mandrill = require('mandrill-api/mandrill').Mandrill,
  mandrill = new Mandrill(process.env.MANDRILL_API_KEY),
  CronJob = require('cron').CronJob,
  markdown = require('markdown').markdown,
  request = require('superagent'),
  environment = process.env.NODE_ENV || 'development',
  publicBucket = process.env.AMAZON_CMS_PUBLIC_BUCKET,
  filePrefix = 'cms',
  envVars = require('./env.js'),
  fileRoot = __dirname + process.env.QUIVER_CMS_ROOT,
  firebaseRoot = new Firebase(envVars.firebase),
  firebaseSecret = process.env.QUIVER_CMS_FIREBASE_SECRET;

/*
 * Firebase root auth
*/
firebaseRoot.auth(firebaseSecret);

/*
 * AWS config
*/
AWS.config.update({accessKeyId: process.env.AMAZON_ACCESS_KEY_ID, secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY});

/*
 * Express middleware
*/
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('cookie-session')({keys: [process.env.QUIVER_CMS_SESSION_SECRET]}));

/**
 * Access Tokens
 */
app.all('*',function (req, res, next) {
//  console.log('url', req.url);
  if (req.param('access_token')) {
    req.session.access_token = req.param('access_token');
  }

  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']); // Allow whatever they're asking for

  next();
});

/*
 * REST Endpoints
*/
app.get('/env', function (req, res) {
  var env = envVars;

  if (req.session.access_token) {
    env.access_token = req.session.access_token;
    env.authorizations = 'Bearer' + req.session.access_token;
  }

  res.json(env);
});

app.get('/files', function (req, res) {
  res.json({files: []});
});

/*
 * Finish this sucka up
*/
app.listen(9800);
