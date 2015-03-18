var ConfigService = require('./config-service'),
	LogService = require('./log-service'),
	FirebaseService = require('./firebase-service'),
	_ = require('underscore'),
	fs = require('fs'),
	AWSService = require('./aws-service'),
	AWS = AWSService.AWS,
	S3 = new AWS.S3(),
	Q = require('q'),
	fs = require('fs-extra'),
	moment = require('moment'),
	easyimage = require('easyimage'),
	slug = require('slug'),
	publicBucket = ConfigService.get('public.amazon.publicBucket'),
  filePrefix = (ConfigService.get('private.amazon.filePrefix') || 'cms') + '/admin',
  fileUserPrefix = (ConfigService.get('private.amazon.filePrefix') || 'cms') + '/user'
  prefixParts = filePrefix.split('/');

var getSize = function (key) {
		var parts = key.split('/');

		return parts[prefixParts.length];
	},
	isResize = function (key) {
		return !!~['small', 'medium', 'large', 'xlarge'].indexOf(getSize(key));
	};

var service = {
	isResize: isResize,

	updateFilesRegister: function () {
		var deferred = Q.defer(),
	    s3Deferred = Q.defer(),
	    filesRef = FirebaseService.getFiles();

	  S3.listObjects({
	    Bucket: publicBucket,
	    Prefix: filePrefix
	  }, function (err, data) {
	    return err ? s3Deferred.reject(err) : s3Deferred.resolve(data);
	  });

	  s3Deferred.promise.then(function (s3Data) {
	    var originals = [],
	      versions = {};
	    _.each(s3Data.Contents, function (file, index) {
	      var parts = file.Key.split('/'),
	        fileName = parts[parts.length - 1].toLowerCase(),
	        suffixParts = fileName.split('.'),
	        suffix = suffixParts[suffixParts.length - 1];

	      file.Name = fileName || false;
	      file.Suffix = suffix ? suffix.toLowerCase() : false;
	      file.Index = index || 0;

	      if (!isResize(file.Key)) {
	        originals.push(file);
	      } else {
	        if (!versions[fileName]) {
	          versions[fileName] = {
	            small: {},
	            medium: {},
	            large: {},
	            xlarge: {}
	          }
	        }
	        versions[fileName][getSize(file.Key)] = file;
	      }

	    });

	    _.each(originals, function (image) {
	      image.Versions = versions[image.Name] || false; // Firebase does not like undefined values
	      // console.log('versions', image.Versions);
	    });

	    originals = _.sortBy(originals, function (original) {
	    	return original.Name;
	    });

	    filesRef.set(s3Data, function (err) {
	    	if (err) {
	    		return deferred.reject(err);
	    	} else {
	    		var originalsRef = filesRef.child('Originals'),
	    			promises = [],
	    			originalsLength = originals.length,
	    			i = originals.length,
	    			handlePush = function (original, priority, originalDeferred) {
	    				promises.push(originalDeferred.promise);

	    				originalsRef.push().setWithPriority(original, priority, function (err) {
    						return err ? originalDeferred.reject(err) : originalDeferred.resolve();
    					});
	    			};

    		 while (i--) {
    		 	handlePush(originals[i], originalsLength - i, Q.defer());
    		 }

    		 Q.all(promises).then(deferred.resolve, deferred.reject);

	    	}

	    });

	  }, deferred.reject);

	  return deferred.promise;
	},

	resizeImages: function () {
	  var deferred = Q.defer(),
	    s3Deferred = Q.defer(),
	    responseDeferred = Q.defer();

	  /*
	   * Clear out directories
	  */
	  fs.removeSync('./resize');
	  fs.mkdirSync('./resize');
	  fs.mkdirSync('./resize/small');
	  fs.mkdirSync('./resize/medium');
	  fs.mkdirSync('./resize/large');
	  fs.mkdirSync('./resize/xlarge');

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
	      var parts = image.Key.split('/'),
	      	size = getSize(image.Key),
	      	suffixParts;

	      image.fileName = parts[parts.length - 1];
	      suffixParts = image.fileName.split('.'),
	      image.suffix = suffixParts[suffixParts.length - 1];

	      if (!~ConfigService.get('public.supportedImageTypes').indexOf(image.suffix.toLowerCase())) { // Screen for supportedImageTypes
	        return;
	      }

	      if (!isResize(image.Key)) {
	        source.push(image);
	      } else if (size === 'small') {
	        small.push(image);
	      } else if (size === 'medium') {
	        medium.push(image);
	      } else if (size === 'large') {
	        large.push(image);
	      } else if (size === 'xlarge') {
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

	    // Filter out gifs... no point in trying to convert them, because they may be animated.
	    var GIF_REGEX = /\.gif$/i;
			source = _.filter(source, function (image) {
	      return !image.fileName.match(GIF_REGEX);
	    });



	    // console.log('source', source);

	    _.each(source, function (image) {
	      var dataDeferred = Q.defer(),
	        downloadDeferred = Q.defer(),
	        parts = image.Key.split('/'),
	        fileName,
	        path;

	      parts.shift();
	      fileName = parts.join('|');
	      path = './resize/' + fileName;

	      promises.push(downloadDeferred.promise);

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

	    });

	    var recursiveDeferred = Q.defer(),
	      imageSizes = ConfigService.get('public.imageSizes'),
	      recursiveResize = function (i) {
	        var promise = promises[i];
	        if (!promise) {
	          recursiveDeferred.resolve();
	        } else {
	          promise.then(function (path) {
	            var parts = path.split('/'),
	              fileName = parts[parts.length - 1];

	            easyimage.resize({src: path, dst: './resize/small/' + fileName, width: imageSizes.small})
	              .then(easyimage.resize({src: path, dst: './resize/medium/' + fileName, width: imageSizes.medium}))
	              .then(easyimage.resize({src: path, dst: './resize/large/' + fileName, width: imageSizes.large}))
	              .then(easyimage.resize({src: path, dst: './resize/xlarge/' + fileName, width: imageSizes.xlarge}))
	              .then(function () {
	                recursiveResize(i + 1);
	              }, recursiveDeferred.reject);
	          });

	        }
	      };

	    recursiveResize(0);

	    recursiveDeferred.promise.then(function () {
	      var promises = [],
	        deferred = Q.defer(),
	        uploadFile = function (image, folder) {
	          return function () {
	            var readDeferred = Q.defer(),
	              uploadDeferred = Q.defer(),
	              parts = image.Key.split('/'),
	              path,
	              key;

	            parts.shift();
	            path = './resize/' + folder + '/' + parts.join("|");

	            if (parts[0] === 'admin') {
	            	parts.shift();
	            }

	            key = [filePrefix, folder].concat(parts).join("/");

	            // console.log('reading...', path);
	            fs.readFile(path, function (err, data) {
	              _.delay(function () {
	//                console.log('done reading.', path);
	                return err ? readDeferred.reject(err) : readDeferred.resolve(data);
	              }, 1000);

	            });

	            readDeferred.promise.then(function (data) {
	//              console.log('uploading...', path);
	              S3.putObject({
	                Bucket: publicBucket,
	                Key: key,
	                ACL: 'public-read',
	                Body: data,
	                CacheControl: "max-age=34536000",
	                Expires: moment().add('1 year').unix(),
	                ContentType: 'image/' + image.suffix,
	                StorageClass: "REDUCED_REDUNDANCY"
	              }, function (err, data) {
	//                console.log('uploaded: err, data', err, data, "\n");
	                return err ? uploadDeferred.reject(err) : uploadDeferred.resolve(data);
	              })
	            }, function (err) {
	              console.log('fs.readFile error:', err);
	            });

	            return uploadDeferred.promise;

	          }
	        };

	      var recursiveUploads = function (i) {
	        var image = source[i];
	        if (!image) {
	          deferred.resolve();
	        } else {

	          uploadFile(image, 'small')()
	            .then(uploadFile(image, 'medium'))
	            .then(uploadFile(image, 'large'))
	            .then(uploadFile(image, 'xlarge'))
	            .then(function () {
	              recursiveUploads(i + 1)
	            }, deferred.reject);
	        }
	      }

	      recursiveUploads(0);


	      return deferred.promise;
	    }).then(responseDeferred.resolve, responseDeferred.reject);

	  });

	  // Delete it all
	  responseDeferred.promise.then(function () {
	    fs.remove('./resize');
	  }, function (err) {
	    LogService.error('Resize upload error:', err);
	  });

	  return responseDeferred.promise;
	},

	updateUserFilesRegister: function (userId) {
		var deferred = Q.defer(),
	    s3Deferred = Q.defer(),
	    userFilesRef = FirebaseService.getUserFiles(userId);
// console.log('prefix', fileUserPrefix + '/' + userId);
	  S3.listObjects({
	    Bucket: publicBucket,
	    Prefix: fileUserPrefix + '/' + userId
	  }, function (err, data) {
	    return err ? s3Deferred.reject(err) : s3Deferred.resolve(data);
	  });

	  s3Deferred.promise.then(function (s3Data) {
	    var originals = [],
	      versions = {};
	    _.each(s3Data.Contents, function (file) {
	      var parts = file.Key.split('/'),
	        fileName = parts[parts.length - 1].toLowerCase(),
	        suffixParts = fileName.split('.'),
	        suffix = suffixParts[suffixParts.length - 1];

	      file.Name = fileName;
	      file.Suffix = suffix ? suffix.toLowerCase() : false;
	      file.url = 'https://s3.amazonaws.com/' + publicBucket + '/' + file.Key;

	    });

	    userFilesRef.set(s3Data, function (err) {
	      return err ? deferred.reject(err) : deferred.resolve(s3Data);
	    });

	  }, deferred.reject);

	  return deferred.promise;
	}

};

module.exports = service;