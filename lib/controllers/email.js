var ObjectService = require('../services/object-service'),
	ConfigService = require('../services/config-service'),
	Q = require('q');

module.exports = {
	transaction: function (req, res) {
		var transactionKey = req.params.key,
	    layout = req.params.type === 'html' ? 'email-html'  : 'email-txt',
	    view = req.params.type === 'html' ? 'email-transaction-html' : 'email-transaction-txt',
	    transactionDeferred = ObjectService.getTransaction(transactionKey),
	    userDeferred = Q.defer();

		transactionDeferred.promise.then(function (transaction) {
			ObjectService.getUser(transaction.userId, function (err, user) {
				return err ? userDeferred.reject(err) : userDeferred.resolve(user);
			});
		});  

	  Q.all([transactionDeferred.promise, userDeferred.promise, ObjectService.getSettings()]).spread(function (transaction, user, settings) {
	    app.render(view, {
	        layout: layout,
	        user: user,
	        key: transactionKey,
	        transaction: transaction,
	        email: config.get('private.email'),
	        configPublic: ConfigService.get('public'),
	        settings: settings
	      }, function (err, content) {
	        return err ? res.status(500).send(err) : res.status(200).send(content);   
	      });  
	  });
		
	}
};