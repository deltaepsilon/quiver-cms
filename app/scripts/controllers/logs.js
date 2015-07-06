'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:LogsCtrl
 * @description
 * # LogsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('LogsCtrl', function($scope, logs, $stateParams, $mdDialog, AdminService, NotificationService) {
        $scope.type = $stateParams.type;

        $scope.logs = logs;

        $scope.confirmDelete = function(e) {
            var confirm = $mdDialog.confirm()
                .title($scope.type + ' Logs')
                .content('Are you sure you want to clear all ' + $scope.type + ' logs?')
                .ariaLabel('Clear logs')
                .ok('Yep!')
                .cancel("Naah. Let's play it safe.")
                .targetEvent(e);

            $mdDialog.show(confirm).then(function() {
                AdminService.clearLogs($scope.type).then(function() {
                    NotificationService.success('Logs cleared!');
                    location.reload();
                }, function(error) {
                    NotificationService.error('Something went wrong', error.data);
                });

            }, function() {
                NotificationService.notify('Logs not cleared', 'You played it safe!');
            });
        };
    });