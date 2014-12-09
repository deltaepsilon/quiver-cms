var RedisService = require('../services/redis-service'),
	redis = RedisService.redis,
	LogService = require('../services/log-service'),
  Q = require('q'),
	mime = require('mime');

module.exports = {
	clearPages: function (req, res) {
    redis.keys("page-*", function (err, keys) {
      var getHandler = function (deferred) {
          return function (err) {
            return err ? deferred.reject(err) : deferred.resolve();
          };

        },
        promises = [],
        i = keys.length,
        deferred;

      while (i--) {
        deferred = Q.defer();
        promises.push(deferred.promise);
        redis.del(keys[i], getHandler(deferred));
        
      }

      Q.all(promises).then(function () {
        res.sendStatus(200);
        
      });
      
    });
	  
	},

  flushDb: function (req, res) {
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