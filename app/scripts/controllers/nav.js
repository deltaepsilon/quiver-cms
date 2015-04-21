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

    $scope.subscriptions = subscriptions;

    $scope.subscriptions.$loaded().then(function (subscriptions) {
      var notExpired = _.filter(subscriptions, function (subscription) {
        return !UserService.subscriptionIsExpired(subscription);
      });

      $scope.showSubscriptions = notExpired && notExpired.length;

    });

    $scope.currentSubscriptions = function (subscriptions) {
      return _.filter(subscriptions, function (subscription) {
        return !UserService.subscriptionIsExpired(subscription);
      });

    };

    $scope.$state = $state

    $scope.isExpired = UserService.isExpired;

  });
