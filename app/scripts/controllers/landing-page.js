'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:LandingPageCtrl
 * @description
 * # LandingPageCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('LandingPageCtrl', function($scope, page, AdminService, NotificationService) {
        /*
         * Page
         */
        $scope.page = page;

        $scope.save = function(page) {
            page.$save().then(function() {
                return AdminService.saveLandingPage(page.slug);
            }).then(function() {
                NotificationService.success('Saved');
                $scope.changed = false;
            }, function(error) {
                NotificationService.error('Save error', error);
            });
        };
    });