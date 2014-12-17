'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ResourcesCtrl
 * @description
 * # ResourcesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ResourcesCtrl', function ($scope, AdminService) {
    $scope.remove = function (resource) {
      AdminService.getResource(resource.$id).$remove();
    };
  });
