var ObjectService = require('../services/object-service'),
	Q = require('q'),
	_ = require('underscore');

module.exports = {
	pages: function(req, res) {
		var userRef = req.userRef,
			subscriptionKey = req.params.subscriptionKey,

			subscriptionRef = userRef.child('private').child('commerce').child('subscriptions').child(subscriptionKey);

		Q.all([ObjectService.getSubscriptionWords(), ObjectService.getUserSubscription(req.params.userId, req.params.subscriptionKey)]).spread(function(words, subscription) {
			var hashtags = _.map(subscription.hashtags, function (hashtag) {
					return hashtag.key;
				}),
				pages = {};

			_.each(words, function(word, key) {
				if (!word.hashtags) {
					return false;
				} else {
					var wordHashtags = word.hashtags,
					i = wordHashtags.length;

					while (i--) {
						if (~hashtags.indexOf(wordHashtags[i].key)) {
							return pages[key] = word;
						}
					}
					return false;

				}
				
			});

			res.json({pages: pages});

		});

	}

};