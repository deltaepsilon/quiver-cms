'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:LandingPagesCtrl
 * @description
 * # LandingPagesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('LandingPagesCtrl', function($scope, items, $mdDialog, Slug, NotificationService) {
        /*
         * Items
         */
        $scope.items = items;

        $scope.createLandingPage = function(page, items) {
            page.slug = Slug.slugify(page.title);
            items.$add(page).then(function() {
                NotificationService.success('Page created', page.title);
            }, function(error) {
                NotificationService.error('Page creation failed', error);
            });
        }

        $scope.confirmRemoveLandingPage = function(e, page, pages) {
            var confirm = $mdDialog.confirm()
                .title(page.title)
                .content('Are you sure you want to destroy me?')
                .ariaLabel('Delete landing page ' + page.title)
                .ok('Bye bye!')
                .cancel("Maybe I'll need you later?")
                .targetEvent(e);

            $mdDialog.show(confirm).then(function() {
                pages.$remove(page).then(function() {
                    NotificationService.success('Landing Page Deleted');
                });

            }, function() {
                NotificationService.notify('Not destroyed!');

            });

        };
    });