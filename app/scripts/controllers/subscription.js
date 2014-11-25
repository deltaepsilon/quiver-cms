'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SubscriptionCtrl
 * @description
 * # SubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SubscriptionCtrl', function ($scope, subscriptionRef, pages) {
    $scope.subscription = subscriptionRef.$asObject();

    $scope.pages = pages;
    
  });
