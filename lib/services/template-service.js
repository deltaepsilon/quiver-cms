var Q = require('q'),
	fs = require('fs'),
	_ = require('underscore'),
	slug = require('slug');

module.exports = {
	setThemes: function () {
		var readDeferred = Q.defer(),
	    finalDeferred = Q.defer();
	  fs.readdir('./themes', function (err, files) {
	    return err ? readDeferred.reject(err) : readDeferred.resolve(files);
	  });

	  readDeferred.promise.then(function (files) {
	    var i = files.length,
	      obj = {};

	    while (i--) {
	      obj[slug(files[i]).toLowerCase()] = files[i];
	    };

	    FirebaseService.firebaseRoot.child('theme').child('options').set(obj, function (err) {
	      return err ? finalDeferred.reject(err) : finalDeferred.resolve(files);
	    });
	  });

	  return finalDeferred.promise;
	},

	setAlternates: function () {
		var readDeferred = Q.defer(),
	    finalDeferred = Q.defer();
	  fs.readdir('./themes/quiver/views', function (err, files) {
	    var REGEX = '\.alt\.'
	    files = _.filter(files, function (file) {
	      return file.match(REGEX);
	    });
	    return err ? readDeferred.reject(err) : readDeferred.resolve(files);
	  });

	  readDeferred.promise.then(function (files) {
	    var alternates = [];

	    _.each(files, function (file) {
	      var parts = file.split('.');
	      alternates.push({
	        filename: file,
	        slug: slug(parts[0]).toLowerCase(),
	        name: parts[0]
	      });
	    });

	    FirebaseService.firebaseRoot.child('theme').child('alternates').set(alternates, function (err) {
	      return err ? finalDeferred.reject(err) : finalDeferred.resolve(alternates);
	    });
	  });

	  return finalDeferred.promise;
	  	
	}

};