'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ModeratorMessagesListCtrl
 * @description
 * # ModeratorMessagesListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ModeratorMessagesListCtrl', function($scope, ModeratorService, $stateParams, _, moment) {       
        $scope.items = ModeratorService.getMessages($scope.assignment.$id).$get();

        /*
         * Search
         */
        $scope.searchTerm = $stateParams.search;

        $scope.setSearch = function (term) {
            $scope.searchTerm = term;
        };
    });