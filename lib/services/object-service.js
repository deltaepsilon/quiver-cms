var FirebaseService = require('./firebase-service'),
	Utility = require('../extensions/utility'),
	RedisService = require('./redis-service');

module.exports = {
	getDiscounts: function (cb) {
		var	deferred = Utility.async(cb);

		RedisService.getDiscounts(false, function (err, discounts) {
			return err ? RedisService.setDiscounts() : deferred.resolve(discounts);
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
		
		RedisService.getSettings(false, function (err, settings) {
			return err ? deferred.reject(err) : deferred.resolve(settings);
		});

		return deferred.promise;
	},

	getTheme: function (cb) {
		var deferred = Utility.async(cb);
		
		RedisService.getTheme(false, function (err, theme) {
			return err ? deferred.reject(err) : deferred.resolve(theme);
		});

		return deferred.promise;
	},

	getHashtags: function (cb) {
		var deferred = Utility.async(cb);

		RedisService.getHashtags(false, function (err, hashtags) {
			return err ? deferred.reject(err) : deferred.resolve(hashtags);
		});

		return deferred.promise;
	},

	getWords: function (cb) {
		var deferred = Utility.async(cb);
		
		RedisService.getWords(false, function (err, words) {
			return err ? deferred.reject(err) : deferred.resolve(words);
		});

		return deferred.promise;
	},

	getWord: function (slug, cb) {
		var deferred = Utility.async(cb);
		
		RedisService.getWord(slug, function (err, word) {
			return err ? deferred.reject(err) : deferred.resolve(word);
		});

		return deferred.promise;
	},	

	getProducts: function (cb) {
		var deferred = Utility.async(cb);
		
		RedisService.getProducts(false, function (err, products) {
			return err ? deferred.reject(err) : deferred.resolve(products);
		});

		return deferred.promise;
	},

	getTransaction: function (key, cb) {
		var deferred = Utility.async(cb);

		FirebaseService.getTransaction(key).once('value', function (snap) {
			deferred.resolve(snap.val());
		});

		return deferred.promise;
	}
	
};