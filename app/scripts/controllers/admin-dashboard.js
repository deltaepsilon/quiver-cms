'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminDashboardCtrl
 * @description
 * # AdminDashboardCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('AdminDashboardCtrl', function($scope, reports, backups, AdminService, NotificationService) {
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

        /*
         * Backup
         */
        $scope.backups = backups;

        $scope.runBackup = function() {
            $scope.runningBackup = true;
            AdminService.runBackup().then(function() {
                NotificationService.success('Backup Run!');
                delete $scope.runningBackup;
                $scope.updateBackups();
            }, function(error) {
                NotificationService.error('Backup Error', error);
                delete $scope.runningBackup;
            });

        };

        $scope.updateBackups = function() {
            $scope.updatingBackups = true;
            AdminService.updateBackups().then(function() {
                NotificationService.success('Backup Updated!');
                delete $scope.updatingBackups;
            }, function(error) {
                NotificationService.error('Backup Update Error', error);
                delete $scope.updatingBackups;
            });

        };

    });