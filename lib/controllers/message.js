var FirebaseService = require('../services/firebase-service'),
  ConfigService = require('../services/config-service'),
  ObjectService = require('../services/object-service'),
  LogService = require('../services/log-service'),
  FileService = require('../services/file-service'),
  MessageService = require('../services/message-service'),
  AWSService = require('../services/aws-service'),
  AWS = AWSService.AWS,
  S3 = new AWS.S3(),
  fs = require('fs-extra'),
  Q = require('q'),
  slug = require('slug'),
  moment = require('moment'),
  _ = require('underscore'),
  request = require('superagent'),
  publicBucket = ConfigService.get('public.amazon.publicBucket'),
  fileUserPrefix = (ConfigService.get('private.amazon.filePrefix') || 'cms') + '/user',
  errorHandler = function (res, err) {
    LogService.error('message', err);
    res.status(500).send(err);
  };

return module.exports = {
  log: function (req, res) {
    var user = req.user,
      userId = req.params.userId,
      assignmentKey = req.params.assignmentKey,
      type = req.params.type,
      messagesRef = FirebaseService.getMessages(),
      now = moment(),
      unix = now.unix(),
      message = {
        date: now.format(),
        unix: unix,
        assignmentKey: assignmentKey,
        type: type,
        userEmail: user.email,
        userName: user.public.name || user.public.email || user.email,
        userId: userId
      };

    _.defaults(message, req.body);

    FirebaseService.authWithSecret(messagesRef).then(function (ref) {
      ref.push(message, function (err) {
        if (message.recipientId && message.recipientId !== userId) {
          var userMessagesRef = FirebaseService.getUserMessages(message.recipientId).push(message, function (err) {
            return err ? res.status(500).send(err) : res.json(message);
          }).setPriority(unix);
        } else {
          return err ? res.status(500).send(err) : res.json(message);
        }
        
      }).setPriority(unix);
      
    });

  },

  upload: function (req, res) {
    /*
     * Configure AWS.S3 payload from request
    */
    var userId = req.params.userId,
      assignmentKey = req.params.assignmentKey,
      fileName = req.body.fileName.toLowerCase(),
      parts = fileName.split('.'),
      suffix = parts[parts.length - 1],
      filePath = req.body.uploadDir + '/' + fileName,
      readDeferred = Q.defer(),
      fileDeferred = Q.defer(),
      mimeType,
      ETag;

    // Calculate mime types
    if (~ConfigService.get('public.supportedImageTypes').indexOf(suffix)) {
      mimeType = 'image';
    } else if (~ConfigService.get('public.supportedVideoTypes').indexOf(suffix)) {
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
          Key: fileUserPrefix + '/' + userId + '/' + fileName.replace(/:/g, "/"), // Filenames with forward slashes in them get copied to the filesystem with ":" instead of the slashes.
          ACL: 'public-read',
          Body: file,
          CacheControl: "max-age=34536000",
          Expires: moment().add(5, 'year').unix(),
          ContentType: mimeType,
          StorageClass: "REDUCED_REDUNDANCY"
        };

        console.log('key', payload.Key);

      /*
       * Upload file
       * Report progress
       */
      var notificationsRef = req.userRef.child('notifications').child(slug(fileName, {charmap: {'.': '-'}}).toLowerCase());

      var s3request = S3.putObject(payload, function (err, data) {
        if (err) {
          fileDeferred.reject(err);
        } else {
          ETag = data.ETag;
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
    fileDeferred.promise.then(function () {
      return FileService.updateUserFilesRegister(userId);
    }).then(function (s3Data) {
      var deferred = Q.defer(),
        upload = _.findWhere(s3Data.Contents, {ETag: ETag}),
        now = moment(),
        unix = now.unix(),
        uploadsRef = FirebaseService.getUploads();

      FirebaseService.authWithSecret(uploadsRef).then(function (ref) {
        ref.push({
          date: now.format(),
          unix: unix,
          userId: userId,
          userEmail: req.user.email,
          assignmentKey: assignmentKey,
          upload: upload
        }, function (err) {
          return err ? deferred.reject(err) : deferred.resolve(upload);
        }).setPriority(unix);
        
      });

      return deferred.promise;
    }).then(function (upload) {
      res.json(upload);
    }, function (err) {
      errorHandler(res, err);
    });
    
  },

  remove: function (req, res) {
    var userId = req.params.userId,
      Key = req.body.Key,
      deleteDeferred = Q.defer();
    
    S3.deleteObject({
      Bucket: publicBucket,
      Key: Key
    }, function (err, data) {
      return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
    });

    deleteDeferred.promise.then(function () {
      return FileService.updateUserFilesRegister(userId);
    }).then(function (s3Data) {
      res.json(s3Data);
    }, function (err) {
      errorHandler(res, err);
    });

  },

  queueFeedbackEmail: function (req, res) {
    MessageService.queueFeedbackEmail(req.params.userId, req.params.assignmentKey).then(function (queuedEmail) {
      res.json(queuedEmail);
    }, function (err) {
      res.status(500).send(err);
    });

  },

  sendQueuedEmail: function (req, res) {
    MessageService.sendQueuedEmail(req.params.emailKey).then(function (result) {
      res.sendStatus(200);
    }, function (err) {
      res.status(500).send(err);
    });
  },

  sendQueuedFeedback: function (req, res) {
    MessageService.sendAllQueuedFeedback().then(function (result) {
      res.sendStatus(200);
    }, function (err) {
      res.status(500).send(err);
    });
  },

  send: function (req, res) {
    MessageService.send(req.params.userId, req.params.recipientId, req.body.text).then(function (result) {
      res.sendStatus(200);
    }, function (err) {
      res.status(500).send(err);
    });
  }

};