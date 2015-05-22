'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ListCtrl
 * @description
 * # ListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ListCtrl', function($scope, $q, $stateParams, items) {

        /*
         * Items
         */
        $scope.items = items;

        /*
         * Search
         */
        $scope.searchTerm = $stateParams.search;

        $scope.setSearch = function (term) {
            $scope.searchTerm = term;
        };

        /*
         * Pagination
         */
        $scope.next = function(items) {
            items.$next().$loaded().then(function(newItems) {
                items = newItems;
            });
        };

        $scope.prev = function(items) {
            items.prev().$loaded().then(function(newItems) {
                items = newItems;
            });
        };

        $scope.more = function(items) {
            items.$more().$loaded().then(function(newItems) {
                items = newItems;
            });
        };

        $scope.reset = function(items) {
            items.$reset().$loaded().then(function(newItems) {
                items = newItems;
            });
        };

        /*
         * Array management
         */
        $scope.saveItem = function(items, item) {
            return items.$save(item);
        };

        $scope.removeItem = function(items, item) {
            return items.$remove(item);
        };

    });