var LogService = require('./log-service');
var FirebaseService = require('./firebase-service');
var ObjectService = require('./object-service');
var Utility = require('../extensions/utility');
var moment = require('moment');
var _ = require('underscore');
var Q = require('q');
var slug = require('slug');
var ConfigService = require('../services/config-service');

module.exports = {
    run: function (cb) {
        var deferred = Utility.async(cb),
            reportsRef = FirebaseService.getReports(),
            promises = [];

        reportsRef.remove(function () {
            /*
             * Discounts
             */
            var discountsDeferred = Q.defer();
            promises.push(discountsDeferred.promise);
            FirebaseService.getLogs().child('discounts').once('value', function (snap) {
                var report = {
                    created: moment().format(),
                    byDay: {}
                };

                snap.forEach(function (childSnap) {
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

                reportsRef.child('discounts').set(report, function (err) {
                    return err ? discountsDeferred.reject(err) : discountsDeferred.resolve();
                });

            });

            /*
             * Surveys
             */
            var surveysDeferred = Q.defer();
            promises.push(surveysDeferred.promise);
            FirebaseService.getSettings().child('surveys').once('value', function (snap) {
                var surveys = snap.val(),
                    report = {
                        created: moment().format()
                    };

                FirebaseService.getLogs().child('surveys').once('value', function (snap) {
                    snap.forEach(function (childSnap) {
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
                                response: response.response || false,
                                responders: [],
                                count: 0
                            };
                            surveys[response.surveyKey].responses.push(existingResponse);
                        }

                        existingResponse.count += 1;
                        existingResponse.responders.push(_.pick(response, ['userId', 'userEmail', 'answered']));
                    });

                    report.bySurvey = surveys;

                    reportsRef.child('surveys').set(report, function (err) {
                        return err ? surveysDeferred.reject(err) : surveysDeferred.resolve();
                    });

                });
            });

            /*
             * Sales
             */
            var salesDeferred = Q.defer();
            promises.push(salesDeferred.promise);
            FirebaseService.getUserObjects().child('transactions').once('value', function (snap) {
                var salesReport = {
                    byDay: {},
                    byWeek: {},
                    byMonth: {},
                    byYear: {}
                };
                var blankReport = {
                    subtotal: 0,
                    discount: 0,
                    shipping: 0,
                    tax: 0,
                    total: 0,
                    transactionCount: 0
                };
                var summaryFields = Object.keys(blankReport);

                snap.forEach(function (childSnap) {
                    _.each(childSnap.val(), function (transaction) {
                        var date = moment(transaction.date);
                        var year = date.year().toString();
                        var month = year + '|' + date.format('MM');
                        var week = year + '|' + date.format('ww');
                        var day = year + '|' + date.format('DDDD');
                        var reports = {
                            byYearReport: salesReport.byYear[year],
                            byMonthReport: salesReport.byMonth[month],
                            byWeekReport: salesReport.byWeek[week],
                            byDayReport: salesReport.byDay[day]
                        };
                        var referral = transaction.referral ? slug(transaction.referral.referral) : false;

                        //Fill for empty reports
                        _.each(reports, function (report, key) {
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

                        _.each(summaryFields, function (field) {
                            _.each(reports, function (report, key) {
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
                            salesReport.byYear[year].key = year;
                        }
                        if (reports.byMonthReport) {
                            salesReport.byMonth[month] = reports.byMonthReport;
                            salesReport.byMonth[month].key = month
                        }
                        if (reports.byWeekReport) {
                            salesReport.byWeek[week] = reports.byWeekReport;
                            salesReport.byWeek[week].key = week;
                        }
                        if (reports.byDayReport) {
                            salesReport.byDay[day] = reports.byDayReport;
                            salesReport.byDay[day].key = day;
                            salesReport.byDay[day].date = date.format();
                        }

                    });
                });

                var salesReportPromises = [];
                _.each(salesReport, function (report, name) {

                    _.each(_.sortBy(_.toArray(report), 'key'), function (result) {
                        var deferred = Q.defer();
                        salesReportPromises.push(deferred.promise);
                        reportsRef.child('sales').child(name).push(result, function (err) {
                            return err ? deferred.reject(err) : deferred.resolve();
                        });
                    });
                });

                Q.all(salesReportPromises).then(function () {
                    reportsRef.child('sales').child('created').set(moment().format(), function (err) {
                        return err ? salesDeferred.reject(err) : salesDeferred.resolve();
                    });
                });

            });

            /* 
             * Class Breakout
             */

            promises.push(FirebaseService.getUserObjects().child('transactions').once('value')
                .then(function (snap) {
                    var getAccumulated = function (accumulate, day, previousDay, slug) {
                        if (!previousDay || !previousDay[slug]) {
                            accumulate = false;
                        }

                        var result = {
                            subtotal: day[slug].subtotal + (accumulate ? previousDay[slug].subtotal : 0),
                            tax: day[slug].tax + (accumulate ? previousDay[slug].tax : 0),
                            shipping: day[slug].shipping + (accumulate ? previousDay[slug].shipping : 0),
                            discount: day[slug].discount + (accumulate ? previousDay[slug].discount : 0),
                            total: day[slug].total + (accumulate ? previousDay[slug].total : 0)
                        };

                        result.net = result.subtotal - (result.discount || 0);
                        return result;
                    };
                    var round = function (num) {
                        return Math.round(num * 100) / 100;
                    };
                    var blankReport = {
                        subtotal: 0,
                        tax: 0,
                        shipping: 0,
                        discount: 0,
                        total: 0,
                        net: 0
                    };
                    var productSlugMap = ConfigService.get('private.reports.productSlugMap');
                    var report = {};
                    var slugs = {};
                    var items = [];

                    snap.forEach(function (userSnap) {
                        userSnap.forEach(function (transactionSnap) {
                            var transaction = transactionSnap.val();
                            var transactionDate = moment(new Date(transaction.date));
                            var daySlug = transactionDate.format('YYYY-MM-DD');
                            if (transaction.exclude) {
                                return;
                            }

                            _.each(transaction.items, function (item) {
                                var slug = item.slug;
                                var title = item.title;

                                if (item.optionsMatrixSelected) {
                                    slug += '-' + item.optionsMatrixSelected.slug;
                                    title += ': ' + item.optionsMatrixSelected.name;
                                }

                                if (productSlugMap[slug]) {
                                    title = productSlugMap[slug].title; // Order matters
                                    slug = productSlugMap[slug].slug;
                                }

                                if (!~Object.keys(slugs).indexOf(slug)) {
                                    slugs[slug] = {
                                        slug: slug,
                                        title: title
                                    };
                                }

                                if (!report[daySlug]) {
                                    report[daySlug] = {
                                        title: title,
                                        day: {},
                                        month: {},
                                        year: {},
                                        total: {}
                                    };
                                }

                                if (!report[daySlug].day[slug]) {
                                    report[daySlug].day[slug] = _.clone(blankReport);
                                }

                                var subtotal = (item.priceAdjusted || item.price) * item.quantity;
                                var subtotalRatio = transaction.subtotal ? subtotal / transaction.subtotal : 0;
                                var result = {
                                    date: daySlug,
                                    slug: slug,
                                    subtotal: subtotal,
                                    tax: transaction.tax ? round(transaction.tax * subtotalRatio) : 0,
                                    shipping: transaction.shipping ? round(transaction.shipping * subtotalRatio) : 0,
                                    discount: transaction.discount ? round(transaction.discount * subtotalRatio) : 0,
                                    total: round(transaction.total * subtotalRatio)
                                };

                                items.push(result);

                                report[daySlug].day[slug].subtotal += result.subtotal;
                                report[daySlug].day[slug].tax += result.tax;
                                report[daySlug].day[slug].shipping += result.shipping;
                                report[daySlug].day[slug].discount += result.discount;
                                report[daySlug].day[slug].total += result.total;
                                report[daySlug].day[slug].net += result.subtotal - (result.discount || 0);
                            });
                        });
                    });

                    var days = Object.keys(report).sort();
                    var daysCount = days.length;
                    var day;
                    var sameMonth;
                    var sameYear;

                    for (var i = 0; i < daysCount; i++) {
                        day = report[days[i]];

                        var slugsList = Object.keys(day.day);
                        var j = slugsList.length;
                        var slug;

                        while (j--) {
                            slug = slugsList[j];



                            var previousDay;
                            var k = i;
                            while (k--) {
                                if (report[days[k]].day[slug]) {
                                    previousDay = report[days[k]];
                                    sameYear = days[i].split('-')[0] === days[k].split('-')[0];
                                    sameMonth = days[i].split('-')[1] === days[k].split('-')[1];
                                    break;
                                }
                            }

                            report[days[i]].year[slug] = getAccumulated(sameYear, day.day, previousDay ? previousDay.year : false, slug);
                            report[days[i]].month[slug] = getAccumulated(sameMonth, day.day, previousDay ? previousDay.month : false, slug);
                            report[days[i]].total[slug] = getAccumulated(true, day.day, previousDay ? previousDay.total : false, slug);
                        }
                    }
                    return {
                        byDay: report,
                        byProduct: slugs,
                        items: items,
                        created: moment().format()
                    };
                })
                .then(function (report) {
                    return reportsRef.child('byDayByProduct').set(report);
                }));

            /*
             * Return results
             */
            Q.all(promises).then(function () {
                deferred.resolve({
                    updated: moment().format()
                });
            }, function (err) {
                console.log('report-service error', err);
                deferred.reject(err);
            });
        });

        return deferred.promise;
    }
}