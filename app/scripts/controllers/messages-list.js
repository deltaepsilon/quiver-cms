'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:MessagesListCtrl
 * @description
 * # MessagesListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('MessagesListCtrl', function ($scope, AdminService) {
    /*
     * Flags
     */
    $scope.incrementMessageFlag = AdminService.incrementMessageFlag;
  });
