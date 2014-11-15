var FeedService = require('../services/feed-service'),
	RedisService = require('../services/redis-service');

service = {
	feed: function (type) {
		return function (req, res) {
			 FeedService.getFeed(function (err, feed) {
				if (err) {
					res.status(500).send(err);	
				} else {
					var xml = feed.render('atom-1.0');
			    res.status(200).send(xml);
			    RedisService.cachePage(req.url, xml)	
				}
		    
		  });	
		}
	}
	atom: function (req, res) {
		service.feed('atom-1.0')(req, res);
	},

	rss: function (req, res) {
		service.feed('rss-2.0')(req, res);
	}
};

module.exports = service;