var LogService = require('./log-service'),
    FirebaseService = require('./firebase-service'),
    ObjectService = require('./object-service'),
    Utility = require('../extensions/utility'),
    moment = require('moment'),
    _ = require('underscore'),
    Q = require('q');

module.exports = {
    run: function(cb) {
        var deferred = Utility.async(cb),
            reportsRef = FirebaseService.getReports();

        FirebaseService.getLogs().once("value", function(snap) {
            var promises = [],
                logs = snap.val();

            if (logs.discounts) {
                var discountsDeferred = Q.defer(),
                    discountsReport = {
                        created: moment().format(),
                        byDay: {}
                    };
                promises.push(discountsDeferred.promise);

                _.each(logs.discounts, function(discount) {
                    var date = moment(discount.date),
                        daystamp = date.format('YYYY-MM-DD'),
                        entry = _.pick(discount, ['code', 'useCount', 'uses', 'value', 'percentage', 'discount']);

                    entry.userEmail = discount.user.email;
                    entry.userId = discount.user.public.id;

                    if (!discountsReport.byDay[daystamp]) {
                        discountsReport.byDay[daystamp] = [];
                    }

                    discountsReport.byDay[daystamp].push(entry);
                });

                reportsRef.child('discounts').set(discountsReport, function(err) {
                    return err ? discountsDeferred.reject(err) : discountsDeferred.resolve();
                });

            }


            Q.all(promises).then(function() {
                deferred.resolve({
                    updated: moment().format()
                });
            }, function(err) {
                deferred.reject(err);
            });

        });


        return deferred.promise;
    }
}