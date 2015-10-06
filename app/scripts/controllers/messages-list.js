'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:MessagesListCtrl
 * @description
 * # MessagesListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('MessagesListCtrl', function($scope, ModeratorService, items) {
        /*
         * Items
         */
        $scope.items = items;

        /*
         * Flags
         */
        $scope.incrementMessageFlag = ModeratorService.incrementMessageFlag;

    });