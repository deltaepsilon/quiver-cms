var CheckoutService = require('../services/checkout-service'),
	PaymentService = require('../services/payment-service');

module.exports = {
	checkout: function (req, res) {
		CheckoutService.createTransaction(req.user, req.body.cart)
			.then(PaymentService.createTransaction)
	    .then(CheckoutService.createSubscriptions)
	    .then(CheckoutService.createDiscounts)
	    .then(CheckoutService.createShipments)
	    .then(CheckoutService.createDownloads)
	    .then(CheckoutService.saveTransaction)
	    .then(CheckoutService.sendTransactionEmail)
	    .then(function (transaction) {
	      res.json(transaction);
	    }, function (err) {
	        LogService.error('Checkout', err);
	        res.sendStatus(500);
	    });
	}
	
};