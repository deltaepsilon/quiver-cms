var ConfigService = require('./config-service'),
	Firebase = require('firebase'),
	firebaseEndpoint = ConfigService.get('public.firebase.endpoint'),
  firebaseRoot = new Firebase(firebaseEndpoint),
  firebaseSecret = ConfigService.get('private.firebase.secret');

firebaseRoot.auth(firebaseSecret);

module.exports = {
	firebaseRoot: firebaseRoot,

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

	getUser: function (key) {
		return firebaseRoot.child('users').child(key);
	},

	getDiscounts: function () {
		return firebaseRoot.child('discounts');
	},

	getSettings: function () {
		return firebaseRoot.child('settings');
	}
	
}