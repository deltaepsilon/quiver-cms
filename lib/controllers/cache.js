var RedisService = require('../services/redis-service'),
	redis = RedisService.redis,
	LogService = require('../services/log-service'),
	mime = require('mime');

module.exports = {
	clearCache: function (req, res) {
		LogService.info('flushing redis db');
	  redis.flushdb();
	  res.sendStatus(200);
	},

	pages: function (req, res, next) {
		var url = req.url,
      parts = url.split('/');

    parts.shift();

    if (parts[0] === 'static') {
      res.setHeader('Content-Type', mime.lookup(url.split('?')[0]));
    }

    RedisService.getPage(url, function (err, cache) {
    	return cache ? res.send(cache) : next();
    });

	}

};