module.exports = function (firebaseRoot) {
	var Q = require('q'),
		_ = require('underscore'),
		moment = require('moment');

	return {
		createTransaction: function (user, cart) {
			var deferred = Q.defer(),
				transaction = {
					user: user,
					userId: user.public.id,
					transactionCount: user.transactions && user.transctions.length ? user.transactions.length + 1 : 1,
					items: []
				};

			transaction = _.extend(transaction, _.omit(cart, ['items', 'nonce']));

			_.each(cart.items, function (item) {
				transaction.items.push(_.omit(item, ['active', 'isValid', 'description', 'featuredImage', 'images', 'optionGroups', 'optionsMatrix', '$priority']));
			});


			console.log(user);
			console.log("\n&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&\n");
			console.log(cart);


			deferred.resolve(transaction);


			return deferred.promise;
		},

		saveTransaction: function (transaction) {
			var deferred = Q.defer();

			deferred.reject('saveTransaction');

			return deferred.promise;
		},

		createSubscriptions: function (transaction) {
			var deferred = Q.defer(),
				subscriptions = _.where(transaction.items, {type: 'subscription'});

			transaction.subscriptions = _.map(subscriptions, function (subscription) {
				return _.omit(subscription, ['taxable']);
			});

			deferred.resolve(transaction);

			return deferred.promise;
		},

		createDiscounts: function (transaction) {
			var deferred = Q.defer(),
				discounts = _.where(transaction.items, {type: 'gift'}),
				generateCode = function (salt, i) {
					var code = salt,
			    	possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

		    	while (i--) {
		    		code += possible.charAt(Math.floor(Math.random() * possible.length));
		    	}		        

			    return code;
				};

			transaction.discounts = [];

			_.each(discounts, function (discount) {
				var i = discount.quantity;

				while (i--) { // Users can purchase multiple of each gift certificate, so generate as many discounts as required by discount.quantity
					transaction.discounts.push({
						active: true,
						code: generateCode(transaction.transactionCount + transaction.userId, 6),
						created: moment().format(),
						expiration: moment().add(5, 'year').format(),
						minSubtotal: 0,
						type: 'value',
						useCount: 0,
						uses: 1,
						value: discount.discount,
						price: discount.price,
						priceAdjusted: discount.priceAdjusted,
						optionsMatrixSelected: discount.optionsMatrixSelected,
						user: transaction.user,
						slug: discount.slug
					});
				}
				
			});

			deferred.resolve(transaction);

			return deferred.promise;
		},

		createShippingInstructions: function (transaction) {
			var deferred = Q.defer();




			console.log("\n******************************************\n");
			console.log(transaction);

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