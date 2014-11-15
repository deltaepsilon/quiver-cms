var Q = require('q'),
		_ = require('underscore'),
		ConfigService = require('../services/config-service'),
		FirebaseService = require('../services/firebase-service'),
		ObjectService = require('../services/object-service'),
		braintree = require('braintree'),
		gateway = braintree.connect({
			environment: braintree.Environment[ConfigService.get('private.braintree.environment') || 'Sandbox'],
			merchantId: ConfigService.get('private.braintree.merchantId'),
			publicKey: ConfigService.get('private.braintree.publicKey'),
			privateKey: ConfigService.get('private.braintree.privateKey')
		});

var findCustomer = function (id) {
			var deferred = Q.defer();

		  gateway.customer.find(id, function (err, customer) {
		  	return err ? deferred.reject(err) : deferred.resolve(customer);
		  });

		  return deferred.promise;
		},
		updateCustomer = function (id, customer) {
			var deferred = Q.defer();

			FirebaseService.getUser(id).child('private').child('customer').set(customer, function (err) {
	  		return err ? deferred.reject(err) : deferred.resolve(customer);
	  	});

			return deferred.promise;
		};


module.exports = {
	getClientToken: function (req, res) {
		gateway.clientToken.generate({
			customerId: req.user.id
  	}, function (err, response) {
    	if (err) {
      		res.status(500).send(err);
    	} else {
      		res.status(200).send(response.clientToken);
    	}
  	});	
	},
	createPaymentMethod: function (req, res) {
		var nonce = req.params.nonce,
			user = req.user,
			email = user.public.email || user.email || 'email missing',
			nameParts = user.public.name ? user.public.name.split(' ') : false,
			firstName = nameParts ? nameParts[0]  : email,
			lastName = nameParts.length > 0 ? nameParts.splice(1).join(' ') : null,
			userRef = req.userRef,
		  vaultDeferred = Q.defer(),
		  handleError = function (err) {
		  	res.json({error: err});
		  };

		findCustomer(user.public.id).then(function (customer) { // Add payment method
			var updateDeferred = Q.defer();

			gateway.paymentMethod.create({ 
				customerId: user.public.id,
				paymentMethodNonce: nonce
			}, function (err, result) {
				return err || !result.success ? vaultDeferred.reject(err || result.message) : updateDeferred.resolve(result.paymentMethod);
			});

			updateDeferred.promise.then(function (paymentMethod) {
				return findCustomer(user.public.id);
			}).then(vaultDeferred.resolve, vaultDeferred.reject);
			
		}, function () { // Create new customer
		  gateway.customer.create({ 
		  	id: user.public.id,
		  	email: email,
		  	firstName: firstName,
		  	lastName: lastName,
		  	paymentMethodNonce: nonce
		  }, function (err, result) {
		  	return err || !result.success ? vaultDeferred.reject(err || result.message) : vaultDeferred.resolve(result.customer);
		  });	

		});			  

		vaultDeferred.promise.then(function (customer) {
			return updateCustomer(user.public.id, customer)
		}).then(function (customer) {
			res.json(customer);
		}, handleError);

	},
	removePaymentMethod: function (req, res) {
		var user = req.user,
			token = req.params.token,
			deleteDeferred = Q.defer();

		gateway.paymentMethod.delete(token, function (err) {
			return err ? deleteDeferred.reject(err) : deleteDeferred.resolve();
		});

		deleteDeferred.promise.then(function () {
			return findCustomer(user.public.id)
		}).then(function (customer) {
			return updateCustomer(user.public.id, customer);
		}).then(function (customer) {
			res.sendStatus(200);
		}, function (err) {
			res.status(500).send(err);
		});

	},
	getCode: function (req, res) {
		var code = req.params.code,
			discountsRef = FirebaseService.getDiscounts();

		ObjectService.getDiscounts(function (discounts) {
			var discount = _.findWhere(discounts, {code: code});

			if (discount) {
				res.json(discount);
			} else {
				res.status(404).send('Code not found.');
			}				
		});

	},
	chargeTransaction: function (user, transaction) {
		var deferred = Q.defer();
		console.log('user, transaction', user, transaction);
		deferred.reject('chargeTransaction not yet written.');
		return deferred.promise;
	}
	
};

