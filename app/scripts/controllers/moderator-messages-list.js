'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ModeratorMessagesListCtrl
 * @description
 * # ModeratorMessagesListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ModeratorMessagesListCtrl', function($scope, AdminService, $stateParams, _, moment) {
        var query = {
            limit: 10,
            orderBy: 'assignmentKey',
            limitTo: 'last',
            at: {
                type: 'endAt',
                value: $scope.assignment.$id
            }
        };
        
        $scope.items = AdminService.getMessages().$default(query).$get();

        $scope.$watch('items', function (items) {
            items.$loaded().then(function (items) {
               $scope.itemsFiltered = _.where(items, {assignmentKey: $scope.assignment.$id});
            });
            
        });

        // $scope.items.$loaded().then(function(items) {
        //     var i = items.length,
        //         item;

        //     while (i--) {
        //         item = items[i];
        //         item[item.assignmentKey] = item.created;
        //         $scope.items.$save(item);
        //         // item = items[i];
        //         // delete item[item.assignmentKey];
        //         // $scope.items.$save(item);
        //         console.log('item', items[i]);

        //     }
        // });

        $scope.loadMore = function () {
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