'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UserTransactionCtrl
 * @description
 * # UserTransactionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserTransactionCtrl', function ($scope, transactionRef) {
    $scope.transaction = transactionRef.$asObject();
    $scope.transaction.$loaded().then(function (transaction) {
      console.log('transaction', transaction);
    });
  });
