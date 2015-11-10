'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminReportsCtrl
 * @description
 * # AdminReportsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ReportsCtrl', function($scope, reports, AdminService, NotificationService, _) {
        /*
         * Reports
         */
        reports.$loaded().then(function(reports) {
            $scope.reports = {
                discounts: reports.discounts,
                surveys: reports.surveys,
                sales: {
                    created: reports.sales ? reports.sales.created : false
                }
            }
            _.each(reports.sales, function(value, key) {
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

        $scope.runReports = function() {
            $scope.runningReports = true;
            AdminService.runReports().then(function() {
                NotificationService.success('Reports Run!');
                delete $scope.runningReports;
                location.reload();
            }, function(error) {
                NotificationService.error('Reports Error', error);
                delete $scope.runningReports;
            });

        };
    });