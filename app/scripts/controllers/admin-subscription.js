'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminSubscriptionCtrl
 * @description
 * # AdminSubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('AdminSubscriptionCtrl', function ($scope, subscriptionRef) {
    $scope.subscription = subscriptionRef.$asObject();
  });
