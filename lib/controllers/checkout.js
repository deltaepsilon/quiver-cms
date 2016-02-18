var CheckoutService = require('../services/checkout-service');
var PaymentService = require('../services/payment-service');
var LogService = require('../services/log-service');

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
        LogService.error('Checkout error: ' + err.toString());
        LogService.email(err.toString());
        res.sendStatus(500);
      });
  }

};