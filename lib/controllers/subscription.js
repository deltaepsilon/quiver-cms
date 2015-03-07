var ObjectService = require('../services/object-service'),
	FirebaseService = require('../services/firebase-service'),
	LogService = require('../services/log-service'),
	Q = require('q'),
	_ = require('underscore');

module.exports = {
	pages: function(req, res) {
		var userRef = req.userRef,
			subscriptionKey = req.params.subscriptionKey,

			subscriptionRef = FirebaseService.getUserSubscription(userRef.key(), subscriptionKey);

		Q.all([ObjectService.getSubscriptionWords(), ObjectService.getUserSubscription(req.params.userId, req.params.subscriptionKey)]).spread(function(words, subscription) {
			var hashtags = _.map(subscription.hashtags, function (hashtag) {
					return hashtag.key;
				}),
				pages = {};

			_.each(words, function(word, key) {
				if (!word.hashtags || !word.published) {
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

			res.json(_.map(pages, function (page, key) {
				page.$id = key;
				return page;
			}));

		});

	},

	assignments: function (req, res) {
		var userRef = req.userRef,
			subscriptionKey = req.params.subscriptionKey;

		ObjectService.getUserSubscription(req.params.userId, req.params.subscriptionKey).then(function (subscription) {
			return ObjectService.getAssignmentsBySlug(subscription.slug);
		}).then(function (assignments) {
			assignments = _.sortBy(assignments, function (assignment) {
				return assignment.$priority;
			});

			res.json(_.map(assignments, function (assignment, key) {
				return assignment;
			}));
		}, function (err) {
			LogService.error('assignments', err);
			res.status(500).send(err);
		});

	}

};