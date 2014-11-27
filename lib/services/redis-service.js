var ConfigService = require('./config-service'),
	FirebaseService = require('./firebase-service'),
	LogService = require('./log-service'),
	Redis = require('redis'),
  redis = Redis.createClient(),
  moment = require('moment'),
  _ = require('underscore'),
  Utility = require('../extensions/utility'),
  redisTTL = ConfigService.get('private.redis.ttl');

redis.select(ConfigService.get('private.redis.dbIndex'));

redis.on('ready', function (e) {
  LogService.info('redis ready');
});

redis.on('error', function (err) {
  LogService.error('redis error', err);
});

var getter = function (name, individual) {
		return function (key, cb) {
			var deferred = Utility.async(cb),
				newName = individual ? name + '-' + key : name;
			redis.get(newName, function (err, data) {
				return err ? deferred.reject(err) : deferred.resolve(JSON.parse(data));
			});

			return deferred.promise;
		}
	},
	setter = function (name, getRef, saveIndividual, individualAttribute) {
		return function (cb) {
			var deferred = Utility.async(cb),
				ref = getRef(),
				timer = moment();

			ref.on('value', function (snap) {
				var object = snap.val(),
					stringy = JSON.stringify(object);
				
				redis.set(name, stringy, function (err, data) {
					return err ? deferred.reject(err) : deferred.resolve(object);
				});

				if (timer) {
			    LogService.info(name + ' loaded seconds:', moment().diff(timer, 'seconds'));
			    timer = false;
				}

				if (saveIndividual) {
					redis.keys(name + '-*', function (err, keys) {
						var i = keys.length;

						while (i--) {
							redis.del(keys[i]);
						}
						
						ref.on('child_added', function (snap) { // Gets called for each child on initial load and on every change... so it's called a lot.
							var value = snap.val(),
								key = snap.key(),
								slug = individualAttribute ? value[individualAttribute] : key;
							// console.log('adding individual', name + '-' + slug);
							redis.set(name + '-' + slug, snap.val());
						});
						ref.on('child_removed', function (snap) {
							var value = snap.val(),
								key = snap.key(),
								slug = individualAttribute ? value[individualAttribute] : key;
							// console.log('removing individual', name + '-' + slug);
							redis.del(name + '-' + slug);
						});
					});
				}
			});

			return deferred.promise;
		}		
	};

module.exports = {
	redis: redis,

	setPage: function (url, html, cb) {
		var deferred = Utility.async(cb);

		redis.set('page-' + url, html, function (err, result) {
			redis.expire('page-' + url, redisTTL);
			return err ? deferred.reject(err) : deferred.resolve(result);
		});

		return deferred.promise;
		
	},

	getPage: function(key, cb) {
		var deferred = Utility.async(cb);

		redis.get('page' + '-' + key, function (err, data) {
			return err ? deferred.reject(err) : deferred.resolve(data);
		});

		return deferred.promise;
	},

	getDiscounts: getter('discounts'),

	getDiscount: getter('discounts', true),

	setDiscounts: setter('discounts', FirebaseService.getDiscounts, true),	

	getWords: getter('words'),

	getWord: getter('words', true),

	setWords: setter('words', FirebaseService.getWords, true, 'slug'),

	getProducts: getter('products'),

	getProduct: getter('products', true),

	setProducts: setter('products', FirebaseService.getProducts, true, 'slug'),

	getSettings: getter('settings'),

	setSettings: setter('settings', FirebaseService.getSettings),

	getTheme: getter('theme'),

	setTheme: setter('theme', FirebaseService.getTheme),

	getHashtags: getter('hashtags'),

	setHashtags: setter('hashtags', FirebaseService.getHashtags)

};