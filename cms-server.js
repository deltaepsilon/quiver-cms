require('newrelic');
var Q = require('q'),
  _ = require('underscore'),
  express = require('express'),
  app = express(),
  fs = require('fs'),
  multer = require('multer'),
  winston = require('winston'),
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
 * Winston logging config
*/
var uploadLogger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({ filename: './logs/upload.log' })
    ]
  }),
  errorHandler = function (res, err) {
    var error = new Error(err)
    console.log('error', error.stack);
    winston.log('error', err);
    res.status(500).send(err);
  };
winston.add(winston.transports.File, { filename: './logs/quiver-cms.log'});
winston.remove(winston.transports.Console);

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
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multer({
  dest: './uploads/',
  onError: function (error) {
    uploadLogger.log('error', error);
  }
}));
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

app.post('/files/:fileName', function (req, res) {
  /*
   * Configure S3 payload from request
  */
  winston.log('req.body', req.body);

  var fileName = req.params.fileName,
    dataUrl = req.body.file,
    matches = dataUrl.match(/^data:.+\/(.+);base64,(.*)$/),
    fileDeferred = Q.defer();

  if (!matches) {
    return errorHandler(res, {"error": "No file sent."});
  }

  var extension = matches[1],
    file = new Buffer(matches[2], "base64"),
    type = req.body.type,
    payload = {
      Bucket: publicBucket,
      Key: filePrefix + '/' + fileName,
      ACL: 'public-read',
      Body: file,
      CacheControl: "max-age=34536000",
      ContentType: type,
      StorageClass: "REDUCED_REDUNDANCY"
    };

  /*
   * Upload file
  */
  S3.putObject(payload, function (err, data) {
    if (err) {
      fileDeferred.reject(err);
    } else {
      console.log('s3 data', data);
      fileDeferred.resolve(data);
    }

  });

  /*
   * Handle file upload results
  */
  var filesRef = new Firebase(envVars.firebase + '/content/files'),
    firebaseDeferred = Q.defer();

  filesRef.auth(firebaseSecret, firebaseDeferred.resolve, firebaseDeferred.reject);

  Q.all(fileDeferred.promise, firebaseDeferred.promise).then(updateFilesRegister).then(function (s3Data) {
    res.json(s3Data);
  }, function (err) {
    errorHandler(res, err);
  });

});

var updateFilesRegister = function() {
  var deferred = Q.defer(),
    firebaseDeferred = Q.defer(),
    s3Deferred = Q.defer(),
    filesRef = new Firebase(envVars.firebase + '/content/files');

  filesRef.auth(firebaseSecret, firebaseDeferred.resolve, firebaseDeferred.reject);

  S3.listObjects({
    Bucket: publicBucket,
    Prefix: filePrefix
  }, function (err, data) {
    return err ? s3Deferred.reject(err) : s3Deferred.resolve(data);
  });

  Q.all([s3Deferred.promise, firebaseDeferred.promise]).spread(function (s3Data) {
    console.log('filesRef s3Data', filesRef, s3Data);
    filesRef.set(s3Data, function (err) {
      return err ? deferred.reject(err) : deferred.resolve(s3Data);
    });
  }, deferred.reject);

  return deferred.promise;
};

/*
 * Finish this sucka up
*/
app.listen(9800);
