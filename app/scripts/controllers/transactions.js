'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:TransactionsCtrl
 * @description
 * # TransactionsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('TransactionsCtrl', function ($scope, transactionsRef, limit, $stateParams, AdminService) {
    /*
     * Transactions
     */
    var transactions = transactionsRef.$asArray();
    $scope.transactions = transactions;

    /*
     * Query
     */
    var query = function (q) {
      var q = q || {orderByPriority: true, limitToLast: $scope.limit};

      transactionsRef = AdminService.getTransactions(q);
      transactions = transactionsRef.$asArray();
      transactions.$loaded().then(function (transactions) {
        $scope.transactions = transactions;
      });
    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);

      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.search = function (term) {
      $scope.searching = true;
      query({orderByPriority: true, orderByChild: 'userEmail', startAt: term});
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };

    transactions.$loaded().then(function () {
      if ($stateParams.search) {
        var term = $stateParams.search;
        $scope.searchTerm = term;
        $scope.search(term);
      }
      
    });
  });
