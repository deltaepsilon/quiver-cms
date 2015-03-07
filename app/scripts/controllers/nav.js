'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:NavCtrl
 * @description
 * # NavCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('NavCtrl', function ($scope, subscriptionsRef) {
    $scope.subscriptions = subscriptionsRef.$asArray();
  });
