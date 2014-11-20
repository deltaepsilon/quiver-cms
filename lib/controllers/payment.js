var Q = require('q'),
		_ = require('underscore'),
		ConfigService = require('../services/config-service'),
		FirebaseService = require('../services/firebase-service'),
		ObjectService = require('../services/object-service'),
		PaymentService = require('../services/payment-service'),
		braintree = require('braintree'),
		gateway = braintree.connect({
			environment: braintree.Environment[ConfigService.get('private.braintree.environment') || 'Sandbox'],
			merchantId: ConfigService.get('private.braintree.merchantId'),
			publicKey: ConfigService.get('private.braintree.publicKey'),
			privateKey: ConfigService.get('private.braintree.privateKey')
		});

module.exports = {
	getClientToken: function (req, res) {
		PaymentService.clientToken(req.user.id, function (err, response) {
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
			first = nameParts ? nameParts[0]  : email,
			last = nameParts.length > 0 ? nameParts.splice(1).join(' ') : null,
			userRef = req.userRef,
		  vaultDeferred = Q.defer(),
		  handleError = function (err) {
		  	res.json({error: err});
		  };

		PaymentService.findCustomer(user.public.id).then(function (customer) { // Add payment method

			PaymentService.createPaymentMethod(user.public.id, nonce).then(function (paymentMethod) {
				return PaymentService.findCustomer(user.public.id);
			}).then(vaultDeferred.resolve, vaultDeferred.reject);
			
		}, function () { // Create new customer
			PaymentService.createCustomer(user.public.id, email, nonce, first, last).then(vaultDeferred.resolve, vaultDeferred.reject);

		});			  

		vaultDeferred.promise.then(function (customer) {
			return PaymentService.updateCustomer(user.public.id, customer)
		}).then(function (customer) {
			res.json(customer);
		}, handleError);

	},
	deletePaymentMethod: function (req, res) {
		var user = req.user,
			token = req.params.token;

		PaymentService.deletePaymentMethod(token)
			.then(function () {
				return PaymentService.findCustomer(user.public.id)
			})
			.then(function (customer) {
				return PaymentService.updateCustomer(user.public.id, customer);
			})
			.then(function (customer) {
				res.sendStatus(200);
			}, function (err) {
				res.status(500).send(err);
			});

	}
	
};

