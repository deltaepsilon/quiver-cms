var FileService = require('../services/file-service'),
	LogService = require('../services/log-service'),
	FirebaseService = require('../services/firebase-service'),
	ConfigService = require('../services/config-service'),
	AWSService = require('../services/aws-service'),
	AWS = AWSService.AWS,
	S3 = new AWS.S3(),
	Q = require('q'),
	fs = require('fs'),
	slug = require('slug'),
	moment = require('moment'),
	_ = require('underscore'),
	publicBucket = ConfigService.get('public.amazon.publicBucket'),
	filePrefix = (ConfigService.get('private.amazon.filePrefix') || 'cms'),
	errorHandler = function (res, err) {
		LogService.error('file', err);
		res.status(500).send(err);
	};

module.exports = {
	filesUpdate: function (req, res) {
		FileService.updateFilesRegister().then(function (s3Data) {
	    res.json(s3Data);
	  }, function (err) {
	    errorHandler(res, err);
	  });
	},

	get: function (req, res) {
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
		},

	post: function (req, res) {
		/*
		 * Configure AWS.S3 payload from request
		*/

		var fileName = req.body.fileName.toLowerCase(),
			parts = fileName.split('.'),
      suffix = parts[parts.length - 1],
		  filePath = req.body.uploadDir + '/' + fileName,
		  readDeferred = Q.defer(),
		  fileDeferred = Q.defer(),
		  mimeType;

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
		      Key: filePrefix + '/admin/' + fileName.replace(/:/g, "/"), // Filenames with forward slashes in them get copied to the filesystem with ":" instead of the slashes.
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
		    progress.loaded = Math.round(2/3 * progress.loaded + 1/3 * progress.total); // Inflate the loaded value by 33%, because this part of the process is the second two thirds of the upload.
		    console.log('setting progress', progress);
		    notificationsRef.set(progress);
		  });
		}, function (err) {
		  errorHandler(res, err)
		});

		/*
		 * Handle file upload results
		*/
		
		fileDeferred.promise.then(FileService.updateFilesRegister).then(function (s3Data) {
		  res.json(s3Data);
		}, function (err) {
		  errorHandler(res, err);
		});
	},

	remove: function (req, res) {
		var fileName = req.body.key.replace(/\|/g, '/'),
			parts = fileName.split('/'),
	    deleteObject = function (folder) {
	      var deleteDeferred = Q.defer(),
	        path = [filePrefix, folder, fileName].join('/').replace(/\/\//g, '/');

	        // console.log('path', filePrefix, folder, fileName, path);

	      S3.deleteObject({
	        Bucket: publicBucket,
	        Key: path
	      }, function (err, data) {
	        return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
	      });

	      return deleteDeferred.promise;
	    };

	   if (parts[0] === 'admin') {
			fileName = parts.splice(1).join('/')   	
	   }

	  Q.all([
	    deleteObject('admin'),
	    deleteObject('admin/small'),
	    deleteObject('admin/medium'),
	    deleteObject('admin/large'),
	    deleteObject('admin/xlarge')
	  ]).then(FileService.updateFilesRegister, FileService.updateFilesRegister).then(function (s3Data) { // Update files register regardless of any errors
	      res.json(s3Data);
	  }, function (err) {
	      errorHandler(res, err);
	  });
	},

	resize: function (req, res) {
		_.delay(function () {
	    FileService.resizeImages().then(FileService.updateFilesRegister, FileService.updateFilesRegister).then(function (data) {
	      res.json(data);
	    });
	  }, 1000);
	}
};