var ObjectService = require('../services/object-service'),
	Utility = require('../extensions/utility'),
	_ = require('underscore'),
	RedisService = require('../services/redis-service'),
	redis = RedisService.redis;

var service = {
	getCode: function (req, res) {
		ObjectService.getDiscounts(function (err, discounts) {
			var discount = _.findWhere(discounts, {code: req.params.code});

			if (discount) {
				res.json(discount);
			} else {
				res.status(404).send('Code not found.');
			}

		});	

	},

	getDiscounts: function (req, res) {
		var deferred = Utility.async();

		redis.get('discounts', function (err, discounts) {
			discounts = JSON.parse(discounts);
			if (req && res) {
				return err ? res.sendStatus(500) : res.json({discounts: discounts});	
			} else {
				return err ? deferred.reject(err) : deferred.resolve(discounts);
			}
	    
	  });

		return deferred.promise;
	  
	  
	},

	refresh: function (req, res) {
		var untrustedCodes = _.toArray(req.body);

	  service.getDiscounts().then(function(trustedCodes) {
	    var untrustedCodesArray = _.pluck(untrustedCodes, 'code'),
	      trustedCodes = _.map(trustedCodes, function (code, key) {
	        code.key = key;
	        return code;
	      }),
	      now = moment().unix();

	      console.log('untrustedCodesArray', untrustedCodesArray, trustedCodes);
	    
	    var unique = _.filter(trustedCodes, function(trustedCode) {
	        if (!~untrustedCodesArray.indexOf(trustedCode.code)) {
	          return false;
	        } else if (!trustedCode.active) {
	          return false;
	        } else if (trustedCode.useCount >= trustedCode.uses) {
	          return false;
	        } else if (moment(trustedCode.expiration).unix() <= now) {
	          return false;
	        }
	        return true;
	      }),
	      sorted = _.sortBy(unique, function (code) {
	        return code.type === 'value' ? 0 : 1;
	      });

	    res.json({codes: sorted});
	  });

	}
};

module.exports = service;