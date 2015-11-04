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

        /*
         * Sales
         */
        var salesDeferred = Q.defer();
        promises.push(salesDeferred.promise);
        FirebaseService.getUserObjects().child('transactions').once('value', function(snap) {
            var salesReport = {
                    byDay: {},
                    byWeek: {},
                    byMonth: {},
                    byYear: {}
                },
                blankReport = {
                    subtotal: 0,
                    discount: 0,
                    shipping: 0,
                    tax: 0,
                    total: 0,
                    transactionCount: 0
                },
                summaryFields = Object.keys(blankReport);

            snap.forEach(function(childSnap) {
                _.each(childSnap.val(), function(transaction) {
                    var date = moment(transaction.date),
                        year = date.year().toString(),
                        month = year + '|' + date.format('MM'),
                        week = year + '|' + date.format('ww'),
                        day = year + '|' + date.format('DDDD'),
                        reports = {
                            byYearReport: salesReport.byYear[year],
                            byMonthReport: salesReport.byMonth[month],
                            byWeekReport: salesReport.byWeek[week],
                            byDayReport: salesReport.byDay[day]
                        },
                        referral = transaction.referral ? transaction.referral.referral : false;

                    //Fill for empty reports
                    _.each(reports, function(report, key) {
                        if (!report) {
                            report = _.clone(blankReport);
                        }
                        if (referral) {
                            if (!report.referrals) {
                                report.referrals = {};
                            }
                            if (!report.referrals[referral]) {
                                report.referrals[referral] = _.clone(blankReport);
                            }
                        }
                        reports[key] = report;
                    });

                    _.each(summaryFields, function(field) {
                        _.each(reports, function(report, key) {
                            var value = transaction[field];

                            if (value && !isNaN(value)) {
                                report[field] += value;
                                if (referral) {
                                    report.referrals[referral][field] += value;
                                }
                                reports[key] = report;
                            }

                        });
                    });

                    if (reports.byYearReport) {
                        salesReport.byYear[year] = reports.byYearReport;
                    }
                    if (reports.byMonthReport) {
                        salesReport.byMonth[month] = reports.byMonthReport;
                    }
                    if (reports.byWeekReport) {
                        salesReport.byWeek[week] = reports.byWeekReport;
                    }
                    if (reports.byDayReport) {
                        salesReport.byDay[day] = reports.byDayReport;
                    }

                });
            });

            salesReport.created = moment().format();

            reportsRef.child('sales').set(salesReport, function(err) {
                return err ? salesDeferred.reject(err) : salesDeferred.resolve();
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