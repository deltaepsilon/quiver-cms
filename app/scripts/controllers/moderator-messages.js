'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ModeratorMessagesCtrl
 * @description
 * # ModeratorMessagesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ModeratorMessagesCtrl', function($scope, ModeratorService, assignments) {
        
        /*
         * Assignments
         */
        $scope.assignments = assignments;

        /*
         * Flags
         */
        $scope.incrementMessageFlag = ModeratorService.incrementMessageFlag;

        $scope.tabSelect = function (assignment) {
            $scope.assignment = assignment;
        };
    });