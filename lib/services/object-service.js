var FirebaseService = require('./firebase-service'),
	Utility = require('../extensions/utility'),
	RedisService = require('./redis-service');

module.exports = {
	getDiscounts: function (cb) {
		var	deferred = Utility.async(cb);

		RedisService.getDiscounts(function (err, discounts) {
			return err ? RedisService.cacheDiscounts() : deferred.resolve(discounts);
		}).then(deferred.resolve, deferred.reject);

		return deferred.promise;

	},

	getUser: function (key, cb) {
		var deferred = Utility.async(cb);

		FirebaseService.getUser(key).once('value', function (snap) {
			deferred.resolve(snap.val());
		});

		return deferred.promise;
	},

	getSettings: function (cb) {
		var deferred = Utility.async(cb);
		
		RedisService.getSettings(function (err, settings) {
			return err ? deferred.reject(err) : deferred.resolve(settings);
		});

		return deferred.promise;
	},

	getWords: function (cb) {
		var deferred = Utility.async(cb);
		
		RedisService.getWords(function (err, words) {
			return err ? deferred.reject(err) : deferred.resolve(words);
		});

		return deferred.promise;
	},

	getWord: function (slug, cb) {
		return RedisService.getWord(slug, cb);
	},	

	getProducts: function (cb) {
		var deferred = Utility.async(cb);
		
		RedisService.getProducts(function (err, products) {
			return err ? deferred.reject(err) : deferred.resolve(products);
		});

		return deferred.promise;
	}
};