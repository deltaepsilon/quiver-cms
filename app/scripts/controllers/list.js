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

        /*
         * Search
         */
        if ($scope.items && $stateParams.search) {
            $scope.items.$loaded().then(function() {

                console.warn('search param is currently broken.');
                var term = $stateParams.search;

                // $scope.items = $scope.items.$orderBy('')

                $scope.searchTerm = term;

                if ($scope.searchField) {
                    q.orderByChild = $scope.searchField;
                } else {
                    q.orderByPriority = true;
                }

                $scope.search(q);
            });

        }

    });