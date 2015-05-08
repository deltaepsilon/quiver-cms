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
            reportsRef = FirebaseService.getReports()
        promises = [];

        /*
         * Discounts
         */
        var discountsDeferred = Q.defer();
        promises.push(discountsDeferred.promise);
        FirebaseService.getLogs().child('discounts').once('value', function(snap) {
            var report = {
                created: moment().format(),
                byDay: {}
            };

            snap.forEach(function(childSnap) {
                var discount = childSnap.val(),
                    date = moment(discount.date),
                    daystamp = date.format('YYYY-MM-DD'),
                    entry = _.pick(discount, ['code', 'useCount', 'uses', 'value', 'percentage', 'discount']);

                entry.userEmail = discount.user.email;
                entry.userId = discount.user.public.id;

                if (!report.byDay[daystamp]) {
                    report.byDay[daystamp] = [];
                }

                report.byDay[daystamp].push(entry);
            });

            reportsRef.child('discounts').set(report, function(err) {
                return err ? discountsDeferred.reject(err) : discountsDeferred.resolve();
            });

        });

        /*
         * Surveys
         */
        var surveysDeferred = Q.defer();
        promises.push(surveysDeferred.promise);
        FirebaseService.getSettings().child('surveys').once('value', function(snap) {
            var surveys = snap.val(),
                report = {
                    created: moment().format()
                };

            FirebaseService.getLogs().child('surveys').once('value', function(snap) {
                snap.forEach(function(childSnap) {
                    var response = childSnap.val(),
                        date = moment(response.date),
                        daystamp = date.format('YYYY-MM-DD'),
                        existingResponse;

                    if (!surveys[response.surveyKey]) {
                        surveys[response.surveyKey] = _.pick(response, ['created', 'name', 'slug', 'question', 'surveyKey']);
                    }
                    if (!surveys[response.surveyKey].responses) {
                        surveys[response.surveyKey].responses = [];
                    }
                    existingResponse = _.findWhere(surveys[response.surveyKey].responses, {
                        response: response.response
                    });

                    if (!existingResponse) {
                        existingResponse = {
                            response: response.response,
                            responders: [],
                            count: 0
                        };
                        surveys[response.surveyKey].responses.push(existingResponse);
                    }

                    existingResponse.count += 1;
                    existingResponse.responders.push(_.pick(response, ['userId', 'userEmail', 'answered']));
                });

                report.bySurvey = surveys;

                reportsRef.child('surveys').set(report, function(err) {
                    return err ? surveysDeferred.reject(err) : surveysDeferred.resolve();
                });

            });
        });


        Q.all(promises).then(function() {
            deferred.resolve({
                updated: moment().format()
            });
        }, function(err) {
            deferred.reject(err);
        });



        return deferred.promise;
    }
}