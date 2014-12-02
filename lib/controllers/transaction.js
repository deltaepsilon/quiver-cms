var ObjectService = require('../services/object-service'),
	CheckoutService = require('../services/checkout-service');

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
		var key = req.params.key,
	    transaction = req.body,
	    userRef = FirebaseService.firebaseRoot.child('users').child('transaction.userId');

	  ObjectService.getUser()
	  	.then(function (user) {
	  		return CheckoutService.chargeTransaction(user, transaction);
	  	})
	  	.then(function (transaction) {
	  		res.json({transaction: transaction});
	  	}, function (err) {
	  		res.status(500).send(err);
	  	});
	  	
	}
};