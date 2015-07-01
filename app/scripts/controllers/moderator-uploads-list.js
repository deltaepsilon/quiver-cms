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
        $scope.items = ModeratorService.getUploads($scope.assignment.$id).$get();

        /*
         * Search
         */
        $scope.searchTerm = $stateParams.search;

        $scope.setSearch = function (term) {
            $scope.searchTerm = term;
        };

    });