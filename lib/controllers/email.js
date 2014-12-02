var ObjectService = require('../services/object-service'),
	ConfigService = require('../services/config-service'),
	EmailService = require('../services/email-service'),
	Q = require('q');

module.exports = {
	transaction: function (req, res) {
		var transactionKey = req.params.key,
	    layout = req.params.type === 'html' ? 'email-html'  : 'email-txt',
	    view = req.params.type === 'html' ? 'email-transaction-html' : 'email-transaction-txt',
	    userDeferred = Q.defer(),
	    transaction;

	    
	  ObjectService.getTransaction(transactionKey, function (err, result) {
	  	transaction = result;
	  	ObjectService.getUser(transaction.userId, function (err, user) {
				return err ? userDeferred.reject(err) : userDeferred.resolve(user);
			});
	  	
	  });

	  Q.all([userDeferred.promise, ObjectService.getSettings()]).spread(function (user, settings) {
	  	EmailService.renderTransactionEmail(view, {
	        layout: layout,
	        user: user,
	        key: transaction.keys.user,
	        transaction: transaction,
	        email: ConfigService.get('private.email'),
	        configPublic: ConfigService.get('public'),
	        settings: settings
	      }).then(function (content) {
	      	res.status(200).send(content);
	      }, function (err) {
	      	res.status(500).send(err);
	      });
	  });
		
	}
};