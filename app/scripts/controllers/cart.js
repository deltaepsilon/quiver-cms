'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:CartCtrl
 * @description
 * # CartCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('CartCtrl', function ($scope, $localStorage) {
    $scope.$storage = $localStorage;
  });
