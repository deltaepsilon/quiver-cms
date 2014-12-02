'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SubscriptionsCtrl
 * @description
 * # SubscriptionsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SubscriptionsCtrl', function ($scope, subscriptionsRef, limit, AdminService) {
  	/*
  	 * Subscriptions
  	 */
  	var subscriptions = subscriptionsRef.$asArray();
    $scope.subscriptions = subscriptions;

    /*
     * Limit
     */
    $scope.limit = limit;

    $scope.loadMore = function() {
    	$scope.limit += limit;

    	subscriptionsRef = AdminService.getSubscriptions({orderByPriority: true, limitToLast: $scope.limit});
    	subscriptionsRef.$asArray().$loaded(function(subscriptions) {
    		$scope.subscriptions = subscriptions;
    	});
    }

    /*
     * Query
     */
    var query = function (q) {
      var q = q || {orderByPriority: true, limitToLast: $scope.limit};

      subscriptionsRef = AdminService.getSubscriptions(q);
      subscriptions = subscriptionsRef.$asArray();
      subscriptions.$loaded().then(function (subscriptions) {
        $scope.subscriptions = subscriptions;
      });
    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);

      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.search = function (term) {
      $scope.searching = true;
      query({orderByPriority: true, orderByChild: 'email', startAt: term});
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };

  });
