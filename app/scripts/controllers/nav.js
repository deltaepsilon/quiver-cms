'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:NavCtrl
 * @description
 * # NavCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('NavCtrl', function ($scope, subscriptions, $state, UserService) {
    subscriptions.$loaded().then(function (subscriptions) {
      $scope.subscriptions = _.filter(subscriptions, function (subscription) {
        return !UserService.subscriptionIsExpired(subscription);
      });
    }) 
    $scope.$state = $state

    $scope.isExpired = UserService.isExpired;

  });
