'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UserTransactionCtrl
 * @description
 * # UserTransactionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserTransactionCtrl', function ($scope, transaction) {
    $scope.transaction = transaction;

  });
