var LogService = require('../services/log-service'),
	ObjectService = require('../services/object-service'),
	CheckoutService = require('../services/checkout-service'),
	PaymentService = require('../services/payment-service'),
	FirebaseService = require('../services/firebase-service');

module.exports = {
	email: function (req, res) {
		ObjectService.getTransaction(req.params.key, function (err, transaction) {
			CheckoutService.sendTransactionEmail(transaction).then(function () {
		    res.sendStatus(200);
		  }, function (err) {
		    res.status(500).send(err);
		  });
			
		});
		
	},

	charge: function (req, res) {
    return PaymentService.createTransaction(req.body)
    	.then(CheckoutService.updateTransaction)
    	.then(function (transaction) {
	  		res.json({transaction: transaction});
	  	}, function (err) {
	  		LogService.error('charge card', err);
	  		res.status(500).send(err);
	  	});  	
	  	
	}
};