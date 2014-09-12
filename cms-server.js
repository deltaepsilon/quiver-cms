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
  slug = require('slug'),
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
//winston.remove(winston.transports.Console);

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
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());
app.use(multer({
  dest: './uploads/',
  limits: {
    fieldSize: '5MB'
  },
  onParseStart: function () {
    console.log('parseStart');
    winston.log('parseStart');
  },
  onParseEnd: function (req, next) {
    console.log('parseEnd', req.body.name, req.body.size);
    winston.log('parseEnd');
    next();
  },
  onFileUploadData: function (file, data) {
    console.log('upload data', file, data);
    winston.log('upload data', file, data);
  },
  onFileUploadStart: function (file) {
    console.log('upload started', file);
    winston.log('upload started', file);
  },
  onFileUploadComplete: function (file) {
    console.log('upload complete', file);
    winston.log('upload complete', file);
  },
  onFileSizeLimit: function (file) {
    console.log('filesize limit', file);
    winston.log('filesize limit', file);
  },
  onError: function (error) {
    winston.log('upload error', error);
    uploadLogger.log('error', error);
  }
}));
app.use(require('cookie-session')({keys: [process.env.QUIVER_CMS_SESSION_SECRET]}));



/**
 * Access Tokens
 */
app.use(function (req, res, next) {
//  console.log('url', req.url);
  if (req.param('access_token')) {
    req.session.access_token = req.param('access_token');
  }

  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, PATCH");
  res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']); // Allow whatever they're asking for

  next();
});

/*
 * Env
*/
app.get('/env', function (req, res) {
  var env = envVars;

  if (req.session.access_token) {
    env.access_token = req.session.access_token;
    env.authorizations = 'Bearer' + req.session.access_token;
  }

  res.json(env);
});

/*
 * Authenticate user and hydrate req.user
*/
app.use(function (req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  var userToken = req.headers.authorization,
    userId = req.headers['user-id'],
    userRef = new Firebase(envVars.firebase + '/users/' + userId),
    handleAuthError = function () {
      return res.status(401).send({'error': 'Not authorized. userId and authorization headers must be present and valid.'});
    };

  userRef.auth(userToken, function (err, currentUser) {
    if (err) {
      return handleAuthError();
    } else {
      userRef.once('value', function (snapshot) {
        var user = snapshot.val();

        if (!user) {
          return handleAuthError();
        } else {
          req.user = user;
          req.userRef = userRef;

          next();
        }

      });
    }

  }, handleAuthError);

});

/*
 * REST
 * 1. files
*/


/*
 * File endpoints
 */
var FILENAME_REGEX = /[^\/]+\.(\w+)$/;
var updateFilesRegister = function() { //Cache S3.listObjects result to Firebase. This is too costly to call often.
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
    _.each(s3Data.Contents, function (file) {
      var matches = file.Key.match(FILENAME_REGEX);
      file.Name = (matches && matches.length) ? matches[0] : file.Key;
      file.Suffix = (matches && matches.length > 0) ? matches[1] : '';
    });
    filesRef.set(s3Data, function (err) {
      return err ? deferred.reject(err) : deferred.resolve(s3Data);
    });
  }, deferred.reject);

  return deferred.promise;
};

app.get('/files', function (req, res) {
  res.json({files: []});
});

app.post('/files/:fileName', function (req, res) {
  /*
   * Configure S3 payload from request
  */

  var fileName = req.params.fileName,
    dataUrl = req.body.file,
    parts = dataUrl.split(';base64'),
    fileDeferred = Q.defer();

  if (!parts) {
    return errorHandler(res, {"error": "No file sent."});
  }

  var extension = parts[0],
    file = new Buffer(parts[1], "base64"),
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
   * Report progress
  */
  var notificationsRef = req.userRef.child('notifications').child(slug(fileName, {charmap: {'.': '-'}}).toLowerCase());

  var s3request = S3.putObject(payload, function (err, data) {
    if (err) {
      fileDeferred.reject(err);
    } else {
      notificationsRef.remove();
      fileDeferred.resolve(data);
    }

  });

  s3request.on('httpUploadProgress', function (progress) {
    notificationsRef.set(progress);
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

app.delete('/files/:fileName', function (req, res) {
  var fileName = req.params.fileName,
    s3Deferred = Q.defer();

  S3.deleteObject({
    Bucket: publicBucket,
    Key: filePrefix + '/' + fileName
  }, function (err, data) {
    return err ? s3Deferred.reject(err) : s3Deferred.resolve(data);
  });

  s3Deferred.promise.then(updateFilesRegister).then(function (s3Data) {
    res.json(s3Data);
  }, function (err) {
    errorHandler(res, err);
  })
});

/*
 * Finish this sucka up
*/
app.listen(9800);
