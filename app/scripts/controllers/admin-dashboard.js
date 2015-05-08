'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminDashboardCtrl
 * @description
 * # AdminDashboardCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('AdminDashboardCtrl', function($scope, reports, AdminService, NotificationService) {
        /*
         * Reports
         */
        $scope.reports = reports;

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