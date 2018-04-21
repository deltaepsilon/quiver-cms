'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ResourcesCtrl
 * @description
 * # ResourcesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ResourcesCtrl', function($scope, AdminService, items, moment, NotificationService, $mdDialog) {
        /*
         * Items
         */
        $scope.items = items;

        /*
         * Methods
         */
        $scope.createResource = function(newResource, userId, userEmail, items) {
            var resource = {
                date: moment().format(),
                keys: {
                    user: userId
                },
                uri: newResource.uri,
                userEmail: userEmail
            };

            if (newResource.ttl) {
                resource.ttl = parseFloat(newResource.ttl) * 54000;
            }

            items.$add(resource).then(function(ref) {
                NotificationService.success('Resource added', ref.key);
            }, function(error) {
                NotificationService.error('Resource add failed', error);
            });

        };

        $scope.confirmRemoveResource = function(e, resource) {
            var confirm = $mdDialog.confirm()
                .title(resource.uri)
                .content('Are you sure you want to destroy me?')
                .ariaLabel('Delete resouce ' + resource.uri)
                .ok('Bye bye resource!')
                .cancel("Maybe I'll need you later?")
                .targetEvent(e);

            $mdDialog.show(confirm).then(function() {
                resource.disabled = true;
                return AdminService.getResource(resource.$id).$remove();
            }).then(function() {
                NotificationService.success('Resource deleted!');
            }, function() {
                NotificationService.notify('Not destroyed!');
            });

        };
    });