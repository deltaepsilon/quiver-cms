module.exports = function (firebaseRoot) {
	var Q = require('q'),
		_ = require('underscore');

	return {
		createTransaction: function (user, cart) {
			var deferred = Q.defer();

			console.log(user);
			console.log("\n&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&\n");
			console.log(cart);
			deferred.reject('createTransaction');

			return deferred.promise;
		},

		saveTransaction: function (transaction) {
			var deferred = Q.defer();

			deferred.reject('saveTransaction');

			return deferred.promise;
		},

		createSubscriptions: function (transaction) {
			var deferred = Q.defer();

			deferred.reject('createSubscriptions');

			return deferred.promise;
		},

		createDiscounts: function (transaction) {
			var deferred = Q.defer();

			deferred.reject('createDiscounts');

			return deferred.promise;
		},

		createShippingInstructions: function (transaction) {
			var deferred = Q.defer();

			deferred.reject('createShippingInstructions');

			return deferred.promise;
		},

		createDownloads: function (transaction) {
			var deferred = Q.defer();

			deferred.reject('createDownloads');

			return deferred.promise;
		},

		sendTransactionEmail: function (transaction) {
			var deferred = Q.defer();

			deferred.reject('sendTransactionEmail');

			return deferred.promise;
		}
	};
}