var CheckoutService = require('../services/checkout-service');

module.exports = {
	checkout: function (req, res) {
		CheckoutService.createTransaction(req.user, req.body.cart)
	    .then(checkoutMethods.createSubscriptions)
	    .then(checkoutMethods.createDiscounts)
	    .then(checkoutMethods.createShipments)
	    .then(checkoutMethods.createDownloads)
	    .then(checkoutMethods.saveTransaction)
	    .then(checkoutMethods.sendTransactionEmail)
	    .then(function (transaction) {
	      res.json(transaction);
	    }, function (err) {
	        LogService.error('Checkout', err);
	        res.sendStatus(500);
	    });
	}
};