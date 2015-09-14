var ObjectService = require('../services/object-service'),
    Utility = require('../extensions/utility'),
    _ = require('underscore'),
    moment = require('moment'),
    RedisService = require('../services/redis-service'),
    redis = RedisService.redis;

var service = {
    getCode: function(req, res) {
        ObjectService.getDiscounts(function(err, discounts) {
            var code = req.params.code.toLowerCase(),
                discount = _.find(discounts, function(discount) {
                    return discount.code.toLowerCase() === code;
                });

            if (discount) {
                res.json(discount);
            } else {
                res.status(404).send('Code not found.');
            }

        });

    },

    breakCache: function (req, res) {
    	RedisService.setDiscounts().then(function () {
    		res.sendStatus(200);
    	}, function (err) {
    		res.setStatus(500).send(err);
    	});
    },

    refresh: function(req, res) {
        var untrustedCodes = _.toArray(req.body);

        service.getDiscounts().then(function(trustedCodes) {
            var untrustedCodesArray = _.pluck(untrustedCodes, 'code'),
                trustedCodes = _.map(trustedCodes, function(code, key) {
                    code.key = key;
                    return code;
                }),
                now = moment().unix();

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
                sorted = _.sortBy(unique, function(code) {
                    return code.type === 'value' ? 0 : 1;
                });

            res.json({
                codes: sorted
            });
        });

    }
};

module.exports = service;