var Q = require('q'),
	FirebaseService = require('./firebase-service'),
	request = require('superagent'),
	_ = require('underscore');

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
	    var resultsObj = {};

	    _.each(results, function (result) {
	      resultsObj[result.term] = result.result;
	    });

	    instagramRef.child('results').set(resultsObj, function (err) {
	      return err ? finalDeferred.reject(err) : finalDeferred.resolve();
	    });

	  });

	  return finalDeferred.promise;
	}
};