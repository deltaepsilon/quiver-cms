var ObjectService = require('../services/object-service.js');

return module.exports = {
    timeout: function (req, res) {
        var delayMillis = 1000 * 60 * 5;
        setTimeout(function () {
            res.sendStatus(200);
        }, delayMillis);
    },
    discounts: function (req, res) {
        ObjectService.getDiscounts().then(function (discounts) {
            res.json(discounts);
        });
    }
};