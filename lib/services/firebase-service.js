var ConfigService = require('./config-service'),
	Firebase = require('firebase'),
	firebaseEndpoint = ConfigService.get('public.firebase.endpoint'),
  firebaseRoot = new Firebase(firebaseEndpoint),
  firebaseSecret = ConfigService.get('private.firebase.secret'),
  Q = require('q'),
  deferred = Q.defer();

firebaseRoot.auth(firebaseSecret, deferred.resolve);

module.exports = {
	firebaseRoot: firebaseRoot,

	isAuthenticated: function (cb) {
		return deferred.promise;
	},

	getWords: function () {
		return firebaseRoot.child('content').child('words');
	},

	getProducts: function () {
		return firebaseRoot.child('content').child('products');
	},

	getInstagram: function () {
		return firebaseRoot.child('content').child('social').child('instagram');
	},

	getFiles: function () {
		return firebaseRoot.child('content').child('files');
	},

	getHashtags: function () {
		return firebaseRoot.child('content').child('hashtags');
	},

	getUser: function (key) {
		return firebaseRoot.child('users').child(key);
	},

	getDiscounts: function () {
		return firebaseRoot.child('discounts');
	},

	getSettings: function () {
		return firebaseRoot.child('settings');
	},

	getTransaction: function (key) {
		return firebaseRoot.child('logs').child('transactions').child(key);
	},

	getTheme: function () {
		return firebaseRoot.child('theme');
	}
	
}