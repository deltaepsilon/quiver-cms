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
        

        /*
         * Items
         */
        $scope.items = ModeratorService.getMessages($scope.assignment.$id).$get();

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