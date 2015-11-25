'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ModeratorUploadsListCtrl
 * @description
 * # ModeratorUploadsListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ModeratorUploadsListCtrl', function($scope, ModeratorService, $stateParams, _, moment) {

        /*
         * Items
         */
        $scope.items = ModeratorService.getUploads($scope.assignment.$id).$get();

        $scope.more = function () {
            $scope.items = $scope.items.$more();  
        };

        /*
         * Search
         */
        $scope.searchTerm = $stateParams.search;

        $scope.setSearch = function (term) {
            $scope.searchTerm = term;
        };

    });