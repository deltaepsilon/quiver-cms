'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:PurchasedCtrl
 * @description
 * # PurchasedCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('PurchasedCtrl', function ($scope, transaction) {
    $scope.transaction = transaction;
  });
