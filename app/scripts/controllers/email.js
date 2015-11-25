'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:EmailCtrl
 * @description
 * # EmailCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('EmailCtrl', function($scope, AdminService, items, $sce, NotificationService, $mdDialog) {
        /*
         * Items
         */
        $scope.items = items;

        /*
         * Methods
         */
        $scope.send = function(email) {
            email.disabled = true;
            return AdminService.sendQueuedEmail(email).then(function() {
                NotificationService.success('Email sent');
                delete email.disabled;
            }, function(error) {
                var message;
                if (typeof error === 'string') {
                    message = error;
                } else if (typeof error === 'object' && error.statusText) {
                    message = error.statusText;
                }

                NotificationService.error('Email error', message);
                delete email.disabled;
            });
        };

        $scope.sendFeedback = function() {
            $scope.loading = true;

            return AdminService.sendQueuedFeedback().then(function() {
                $scope.loading = false;
            }, function(error) {
                NotificationService.error('Send feedback error', error);
                $scope.loading = false;
            });
        };

        $scope.viewEmail = function(e, email) {
            $mdDialog.show({
                controller: function($scope, $mdDialog) {
                    $scope.cancel = $mdDialog.cancel;
                    $scope.email = email;
                    $scope.trustHtml = function(html) {
                        return $sce.trustAsHtml(html);
                    };
                },
                templateUrl: "views/email-dialog.html",
                targetEvent: e
            });
        };

        $scope.deleteEmail = function (email) {
            $scope.items.$remove(email).then(function () {
                NotificationService.success('Email', 'Deleted');
            }, function (error) {
                NotificationService.error('Email deletion error', error)
            });  
        };

    });