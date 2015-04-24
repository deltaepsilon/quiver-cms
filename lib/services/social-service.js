var Q = require('q'),
	FirebaseService = require('./firebase-service'),
	request = require('superagent'),
	_ = require('underscore'),
	moment = require('moment');

module.exports = {
	searchInstagram: function () {
		var firebaseDeferred = Q.defer(),
	    instagramRef = FirebaseService.getInstagram(),
	    instagramPromises = [],
	    requestDeferred = Q.defer(),
	    finalDeferred = Q.defer();

	  instagramRef.once('value', function (snapshot) {
	    var instagram = snapshot.val();
	    return (!instagram || !instagram.clientId) ? firebaseDeferred.reject() : firebaseDeferred.resolve(instagram);
	  });

	  firebaseDeferred.promise.then(function (instagram) {
	    _.each(instagram.terms, function (term) {
	      var deferred = Q.defer();

	      instagramPromises.push(deferred.promise);

	      request.get('https://api.instagram.com/v1/tags/' + term + '/media/recent?client_id=' + instagram.clientId).end(function (err, result) {
	        return err ? deferred.reject(err) : deferred.resolve({term: term, result: result.body});
	      });
	    });

	    Q.all(instagramPromises).then(requestDeferred.resolve, finalDeferred.reject);

	  }, function () {
	    finalDeferred.reject("You'll need a saved client_id to access the Instagram API.");
	  });

	  requestDeferred.promise.then(function (results) {
	    var resultsObj = {
	    	created: moment().format()
	    },
	    promises = [];

	    _.each(results, function (result) {
	    	var termDeferred = Q.defer(),
	    		termRef = instagramRef.child('results').child(result.term),
	    		dataRef = termRef.child('data');

	    	promises.push(termDeferred.promise);

	    	termRef.set({
	    		meta: result.result.meta,
	    		pagination: result.result.pagination
	    	}, function (err) {
	    		return err ? termDeferred.reject(err) : termDeferred.resolve();
	    	});

	    	termDeferred.promise.then(function () {
	    		_.each(result.result.data, function (datum) {
		    		var dataDeferred = Q.defer();
		    		promises.push(dataDeferred.promise);

		    		dataRef.push(datum, function (err) {
		    			return err ? dataDeferred.reject(err) : dataDeferred.resolve();
		    		});
		    	});	

		  		Q.all(promises).then(finalDeferred.resolve, finalDeferred.reject);

	    	});
	      
	    });

	  });

	  return finalDeferred.promise;
	}
};