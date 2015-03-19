'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:NavCtrl
 * @description
 * # NavCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('NavCtrl', function ($scope, subscriptions) {
    $scope.subscriptions = subscriptions;
  });
