'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminReportsCtrl
 * @description
 * # AdminReportsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ReportsCtrl', function ($scope, reports, AdminService, NotificationService, _) {
        /*
         * Reports
         */
        reports.$loaded().then(function (reports) {
            $scope.reports = {
                discounts: reports.discounts,
                surveys: reports.surveys,
                sales: {
                    created: reports.sales ? reports.sales.created : false
                },
                byDayByProduct: reports.byDayByProduct
            };
            _.each(reports.sales, function (value, key) {
                if (typeof value === 'object') {
                    $scope.reports.sales[key] = _.toArray(value);
                }
            });
        });

        $scope.salesReportTypes = {
            byYear: 'Year',
            byMonth: 'Month',
            byWeek: 'Week',
            byDay: 'Day'
        };

        $scope.setProductSelected = function (slug) {
            if (!slug) {
                return [];
            } else {
                var unsorted = _.map($scope.reports.byDayByProduct.byDay, function (report, date) {
                    if (!report.day[slug]) {
                        return undefined;
                    } else {
                        return {
                            date: date,
                            day: report.day[slug],
                            month: report.month[slug],
                            year: report.year[slug],
                            total: report.total[slug]
                        };
                    }
                });
                var i = unsorted.length;
                

                while (i--) {
                    if (!unsorted[i]) {
                        unsorted.splice(i, 1);
                    }
                }

                $scope.byDay = unsorted.sort(function (a, b) {
                    return a.date < b.date;
                });
            }
        };

        $scope.runReports = function () {
            $scope.runningReports = true;
            AdminService.runReports().then(function () {
                NotificationService.success('Reports Run!');
                delete $scope.runningReports;
                location.reload();
            }, function (error) {
                NotificationService.error('Reports Error', error);
                delete $scope.runningReports;
            });
        };
    });