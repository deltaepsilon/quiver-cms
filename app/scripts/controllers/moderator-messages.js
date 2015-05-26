'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ModeratorMessagesCtrl
 * @description
 * # ModeratorMessagesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ModeratorMessagesCtrl', function($scope, AdminService, assignments) {
        
        /*
         * Assignments
         */
        $scope.assignments = assignments;

        /*
         * Flags
         */
        $scope.incrementMessageFlag = AdminService.incrementMessageFlag;

        $scope.tabSelect = function (assignment) {
            $scope.assignment = assignment;
        };
    });