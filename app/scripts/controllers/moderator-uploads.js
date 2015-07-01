'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ModeratorUploadsCtrl
 * @description
 * # ModeratorUploadsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ModeratorUploadsCtrl', function($scope, ModeratorService, assignments) {
        /*
         * Assignments
         */
        $scope.assignments = assignments;

        /*
         * Flags
         */
        $scope.incrementUploadFlag = ModeratorService.incrementUploadFlag;

        $scope.tabSelect = function (assignment) {
            $scope.assignment = assignment;
        };

    });