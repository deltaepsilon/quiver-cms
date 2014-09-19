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
  easyimage = require('easyimage'),
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
    var originals = [],
      versions = {};
    _.each(s3Data.Contents, function (file) {
      var parts = file.Key.split('/'),
        fileName = parts[parts.length - 1].toLowerCase(),
        suffix = fileName.split('.')[1];

      file.Name = fileName;
      file.Suffix = suffix;

      if (parts.length === 2) {
        originals.push(file);
      } else if (parts.length === 3) {
        if (!versions[fileName]) {
          versions[fileName] = {
            small: {},
            medium: {},
            large: {},
            xlarge: {}
          }
        }

        versions[fileName][parts[1]] = file;
      }

    });


    _.each(originals, function (image) {
      image.Versions = versions[image.Name] || false; // Firebase does not like undefined values
    });

    s3Data.Originals = originals;

    filesRef.set(s3Data, function (err) {
      return err ? deferred.reject(err) : deferred.resolve(s3Data);
    });

  }, deferred.reject);

  return deferred.promise;
};

app.get('/files-update', function (req, res) {
  console.log('here!');
  updateFilesRegister().then(function (s3Data) {
    res.json(s3Data);
  }, function (err) {
    errorHandler(res, err);
  });
});

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

  var fileName = req.body.fileName.toLowerCase(),
    suffix = fileName.split('.')[1],
    filePath = './uploads/' + fileName,
    readDeferred = Q.defer(),
    fileDeferred = Q.defer(),
    mimeType;

  // Calculate mime types
  if (~envVars.supportedImageTypes.indexOf(suffix)) {
    mimeType = 'image';
  } else if (~envVars.supportedVideoTypes.indexOf(suffix)) {
    mimeType = 'video';
  } else {
    mimeType = 'application';
  }
  mimeType += '/' + suffix;

  if (!fileName) {
    return errorHandler(res, {"error": "No file sent."});
  }

  fs.readFile(filePath, {encoding: "base64"}, function (err, data) {
    return err ? readDeferred.reject(err) : readDeferred.resolve(data);
  });

  readDeferred.promise.then(function () {
    fs.unlink(filePath, function (err) {
      return err ? console.log(err) : true;
    });
  });

  /*
   * Handle s3 upload
  */

  readDeferred.promise.then(function (data) {
    var file = new Buffer(data, "base64"),
      payload = {
        Bucket: publicBucket,
        Key: filePrefix + '/' + fileName,
        ACL: 'public-read',
        Body: file,
        CacheControl: "max-age=34536000",
        Expires: moment().add(5, 'year').unix(),
        ContentType: mimeType,
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
    deleteObject = function (folder) {
      var deleteDeferred = Q.defer(),
        path = [filePrefix, folder, fileName].join('/').replace(/\/\//g, '/');

      S3.deleteObject({
        Bucket: publicBucket,
        Key: path
      }, function (err, data) {
        return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
      });

      return deleteDeferred.promise;
    };

  Q.all([
    deleteObject(),
    deleteObject('small'),
    deleteObject('medium'),
    deleteObject('large'),
    deleteObject('xlarge')
  ]).then(updateFilesRegister, updateFilesRegister).then(function (s3Data) { // Update files register regardless of any errors
      res.json(s3Data);
  }, function (err) {
      errorHandler(res, err);
  });

});

var resizeImages = function () {
  var deferred = Q.defer(),
    s3Deferred = Q.defer();

  // List all s3 objects
  S3.listObjects({
    Bucket: publicBucket,
    Prefix: filePrefix
  }, function (err, data) {
    return err ? s3Deferred.reject(err) : s3Deferred.resolve(data);
  });

  s3Deferred.promise.then(function (s3Data) {
    var source = [],
      small = [],
      medium = [],
      large = [],
      xlarge = [],
      promises = [];

    _.each(s3Data.Contents, function (image) {
      var parts = image.Key.split('/');

      image.fileName = parts[parts.length - 1];
      image.suffix = image.fileName.split('.')[1];

      if (!~envVars.supportedImageTypes.indexOf(image.suffix.toLowerCase())) { // Screen for supportedImageTypes
        return;
      }

      if (parts.length === 2) {
        source.push(image);
      } else if (parts[2] === 'small') {
        small.push(image);
      } else if (parts[2] === 'medium') {
        medium.push(image);
      } else if (parts[2] === 'large') {
        large.push(image);
      } else if (parts[2] === 'xlarge') {
        xlarge.push(image);
      }

    });

    // Filter out all images which have been fully processed into all four sizes
    source = _.filter(source, function (image) {
      return !_.findWhere(small, {fileName: image.fileName})
        || !_.findWhere(medium, {fileName: image.fileName})
        || !_.findWhere(large, {fileName: image.fileName})
        || !_.findWhere(xlarge, {fileName: image.fileName});
    });

//    console.log('source', source);
    _.each(source, function (image) {
      var dataDeferred = Q.defer(),
        downloadDeferred = Q.defer(),
        smallDeferred = Q.defer(),
        mediumDeferred = Q.defer(),
        largeDeferred = Q.defer,
        xlargeDeferred = Q.defer,
        finalDeferred = Q.defer(),
        fileName = image.Key.split('/').pop(),
        path = './resize/' + fileName;

      promises.push(finalDeferred.promise);

      S3.getObject({
          Bucket: publicBucket,
          Key: image.Key
      }, function (err, data) {
        return err ? dataDeferred.reject(err) : dataDeferred.resolve(data);
      });

      dataDeferred.promise.then(function (data) {
        fs.writeFile(path, data.Body, function (err) {
          return err ? downloadDeferred.reject(err) : downloadDeferred.resolve(path);
        });

      }, deferred.reject);

      downloadDeferred.promise.then(function (path) {
          easyimage.resize({src: path, dst: './resize/small/' + fileName, width: envVars.imageSizes.small}).then(smallDeferred.resolve, smallDeferred.reject);
          easyimage.resize({src: path, dst: './resize/medium/' + fileName, width: envVars.imageSizes.medium}).then(mediumDeferred.resolve, mediumDeferred.reject);
          easyimage.resize({src: path, dst: './resize/large/' + fileName, width: envVars.imageSizes.large}).then(largeDeferred.resolve, largeDeferred.reject);
          easyimage.resize({src: path, dst: './resize/xlarge/' + fileName, width: envVars.imageSizes.xlarge}).then(xlargeDeferred.resolve, xlargeDeferred.reject);
      });

      finalDeferred.promise.then(function () { // Delete source image
        fs.unlink(path, function (err) {
          return err ? console.log(err) : true;
        });
      });

      Q.all([smallDeferred, mediumDeferred, largeDeferred, xlargeDeferred]).then(finalDeferred.resolve, finalDeferred.reject);

    });

    Q.all(promises).spread(function () {
      var promises = [],
        uploadFile = function (image, folder) {
          var readDeferred = Q.defer(),
            uploadDeferred = Q.defer(),
            path = './resize/' + folder + '/' + image.fileName;

          fs.readFile(path, function (err, data) {
            return err ? readDeferred.reject(err) : readDeferred.resolve(data);
          });

          readDeferred.promise.then(function () { // Delete source image
            fs.unlink(path);
          });

          readDeferred.promise.then(function (data) {
            S3.putObject({
              Bucket: publicBucket,
              Key: filePrefix + '/' + folder + '/' + image.fileName.toLowerCase(),
              ACL: 'public-read',
              Body: data,
              CacheControl: "max-age=34536000",
              Expires: moment().add('1 year').unix(),
              ContentType: 'image/' + image.suffix,
              StorageClass: "REDUCED_REDUNDANCY"
            }, function (err, data) {
              return err ? uploadDeferred.reject(err) : uploadDeferred.resolve(data);
            })
          });

          return Q.all([readDeferred.promise, uploadDeferred.promise]);
        };

      _.each(source, function (image) {
        promises.push(Q.all([
          uploadFile(image, 'small'),
          uploadFile(image, 'medium'),
          uploadFile(image, 'large'),
          uploadFile(image, 'xlarge')
        ]));

      });

      return Q.all(promises);
    }).then(deferred.resolve, deferred.reject);

  });

  // Delete it all
  deferred.promise.then(function () {
    fs.unlink()
  });

  return deferred.promise;
};

app.get('/resize', function (req, res) {
  resizeImages().then(function (data) {
    res.json(data);
  });

});

/*
 * Finish this sucka up
*/
app.listen(9800);
