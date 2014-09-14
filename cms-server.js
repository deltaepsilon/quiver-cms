var Q = require('q'),
  _ = require('underscore'),
  express = require('express'),
  app = express(),
  fs = require('fs'),
  formidable = require('formidable'),
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
 * Generic Express middleware
*/
app.use(require('cookie-session')({keys: [process.env.QUIVER_CMS_SESSION_SECRET]}));

/*
 * Body parsing middleware
*/
var parseBody = function (req, res, next) {
    var form = new formidable.IncomingForm();

    form.uploadDir = './uploads';
    form.keepExtensions = true;
    form.maxFieldSize = 100 * 1024;

//    form.on('file', function (name, file) {
//      console.log('file', name);
//      winston.log('file');
//    });
//
//    form.on('progress', function (bytesReceived, bytesExpected) {
//      console.log('progress', bytesReceived, bytesExpected);
//      winston.log('progress');
//    });
//
//    form.on('aborted', function () {
//      console.log('aborted');
//      winston.log('aborted');
//    });
//
//    form.on('end', function () {
//      console.log('end');
//      winston.log('end');
//    });

    form.on('error', function (err) {
      console.log('error', err);
      winston.log('err');
    });

    form.parse(req, function (err, fields, files) {
      req.body = fields;
      req.files = files;
      next();
    });
  };

/*
 * Flow body parsing and file assembly
*/
var chunks = [],
  parseFlow = function (req, res, next) {
    var form = new formidable.IncomingForm();

    form.uploadDir = './uploads';
    form.keepExtensions = true;
    form.maxFieldSize = 100 * 1024;

    form.on('error', function (err) {
      console.log('error', err);
      winston.log('err');
    });

    form.parse(req, function (err, fields, files) {
      //    console.log('parse', err, fields, files);
      var flowFilename = fields.flowFilename,
        flowChunkNumber = parseInt(fields.flowChunkNumber),
        flowTotalChunks = parseInt(fields.flowTotalChunks),
        clearChunks = function (fileName) {
          var deferred = Q.defer(),
            promises = [];

          _.each(_.where(chunks, {flowFilename: fileName}), function (chunk) {
            var chunkDeferred = Q.defer();
            promises.push(chunkDeferred.promise);

            fs.unlink(chunk.file.path, function (err) {
              return err ? chunkDeferred.reject(err) : chunkDeferred.resolve();
            });

          });

          Q.all(promises).then(function () {
            var i = chunks.length;

            while (i--) {
              if (chunks[i].flowFilename === fileName) {
                chunks.splice(i, 1);
              }
            }

            deferred.resolve();

          }, deferred.reject);

          return deferred.promise;
        },
        concatDeferred = Q.defer(),
        concatNextChunk = function (i) {
          var i = i || 1,
            chunk = _.findWhere(chunks, {flowFilename: flowFilename, flowChunkNumber: i.toString()}),
            readDeferred = Q.defer(),
            writeDeferred = Q.defer();

//          console.log('reading', i, chunk.file.path);
          fs.readFile(chunk.file.path, function (err, data) {
            return err ? readDeferred.reject(err) : readDeferred.resolve(data);
          });

          readDeferred.promise.then(function (data) {
//            console.log('appending', i, flowTotalChunks, form.uploadDir + '/' + flowFilename);
            fs.appendFile(form.uploadDir + '/' + flowFilename, data, function (err) {
              return err ? writeDeferred.reject(err) : writeDeferred.resolve();
            });
          });

          Q.all([readDeferred.promise, writeDeferred.promise]).spread(function () {
            return (i === flowTotalChunks) ? concatDeferred.resolve(chunk) : concatNextChunk(i + 1);

          }, concatDeferred.reject);

          return concatDeferred.promise;
        };

      fields.file = files.file;

      chunks.push(fields);

      if (flowChunkNumber === flowTotalChunks) {
        concatNextChunk().then(function (chunk) {
          req.body = chunk;
          req.body.fileName = flowFilename;
          clearChunks(flowFilename).then(next);
        }, function (err) {
          console.log('error', err)
          winston.log('error', err);
          clearChunks(flowFilename).then(function () {
            res.sendStatus(500);
          });
        });
      } else {

        if ( flowChunkNumber % 5 === 0 ) { // Set notification on every fifth chunk
          var notificationsRef = req.userRef.child('notifications').child(slug(flowFilename, {charmap: {'.': '-'}}).toLowerCase());
          notificationsRef.set({
            loaded: flowChunkNumber / 3, // This is roughly the first third of the process, so divide the completion percentage by 3
            total: flowTotalChunks
          });

        }

        res.sendStatus(200);
      }

    });
  };

/**
 * Access Tokens
 */
app.use(function (req, res, next) {
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

app.get('/files', function (req, res) { // Typically used merely for Flow.js testing purposes
  /* req.query = {
     flowChunkNumber: '1',
     flowChunkSize: '1048576',
     flowCurrentChunkSize: '4286',
     flowTotalSize: '4286',
     flowIdentifier: '4286-favicon-ceico',
     flowFilename: 'favicon-ce.ico',
     flowRelativePath: 'favicon-ce.ico',
     flowTotalChunks: '1'
   }
  */
  res.sendStatus(200);
});

app.post('/files', parseFlow); // Use formidable body parser... the Flow variety
app.post('/files', function (req, res) {
  /*
   * Configure S3 payload from request
  */

  var fileName = req.body.fileName,
    filePath = './uploads/' + fileName,
    readDeferred = Q.defer(),
    fileDeferred = Q.defer();

  if (!fileName) {
    return errorHandler(res, {"error": "No file sent."});
  }

  fs.readFile(filePath, {encoding: "base64"}, function (err, data) {
    return err ? readDeferred.reject(err) : readDeferred.resolve(data);
  });

  readDeferred.promise.then(function () {
    console.log('');
    fs.unlink(filePath);
  });

  /*
   * Handle s3 upload
  */

  readDeferred.promise.then(function (data) {
    var file = new Buffer(data, "base64"),
      type = req.body.type,
      payload = {
        Bucket: publicBucket,
        Key: filePrefix + '/' + fileName,
        ACL: 'public-read',
        Body: file,
        CacheControl: "max-age=34536000",
        Expires: moment().add('1 year').unix(),
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
      progress.loaded = 2/3 * progress.loaded + 1/3 * progress.total; // Inflate the loaded value by 33%, because this part of the process is the second two thirds of the upload.
      notificationsRef.set(progress);
    });
  }, function (err) {
    errorHandler(res, err)
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
