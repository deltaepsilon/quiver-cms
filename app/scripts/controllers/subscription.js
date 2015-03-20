'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminSubscriptionCtrl
 * @description
 * # AdminSubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SubscriptionCtrl', function ($scope, subscription, userSubscription, NotificationService, moment, $state) {
    /*
     * Subscription
     */
    $scope.subscription = subscription;

    /*
     * User Subscription
     */
    $scope.userSubscription = userSubscription;

    /*
     * Actions
     */
    $scope.addDays = function (subscription, days) {
      if (!subscription.originalExpiration) {
        subscription.originalExpiration = subscription.expiration;
      }
      subscription.expiration = moment(subscription.expiration).add(days, 'days').format();
      subscription.$save();
    };

    $scope.resetSubscription = function (subscription) {
      delete subscription.expiration;
      subscription.$save();
    };

    $scope.removeSubscription = function () {
      userSubscriptionRef.$remove().then(function () {
        NotificationService.success('Removed', 'User Subscription')  
      }, function (err) {
        NotificationService.error('Failed to Remove', err);
      });

      subscriptionRef.$remove().then(function () {
        NotificationService.success('Removed', 'Subscription Log')
      }, function (err) {
        NotificationService.error('Failed to Remove', err);
      });

      $state.go('authenticated.master.admin.subscriptions');

    };

  });
