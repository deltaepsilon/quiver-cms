var ObjectService = require('../services/object-service'),
	Q = require('q'),
	_ = require('underscore');

module.exports = {
	pages: function(req, res) {
		var userRef = req.userRef,
			subscriptionKey = req.params.subscriptionKey,

			subscriptionRef = userRef.child('private').child('commerce').child('subscriptions').child(subscriptionKey);

		Q.all(ObjectService.getSubscriptionWords(), ObjectService.getUserSubscription(req.params.userId, req.params.subscriptionKey)).spread(function(words, subscription) {
			var hashtags = subscription.hashtags,
				pages;
			console.log('hashtags', hashtags);
			pages = _.filter(words, function(word) {
				var wordHashtags = word.hashtags,
					i = wordHashtags.length;

				while (i--) {
					if (~hashtags.indexOf(wordHashtags[i])) {
						return true;
					}
				}
				return false
			});

			res.json({pages: pages});
		});

	}

};