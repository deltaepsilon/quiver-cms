'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminSubscriptionCtrl
 * @description
 * # AdminSubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('SubscriptionCtrl', function($scope, subscription, userSubscription, NotificationService, moment, $state, $mdDialog) {
        /*
         * Subscription
         */
        $scope.subscription = subscription;

        $scope.orderBy = '-$priority';

        /*
         * User Subscription
         */
        $scope.userSubscription = userSubscription;

        /*
         * Actions
         */
        $scope.addDays = function(subscription) {
            if (!subscription.originalExpiration) {
                subscription.originalExpiration = subscription.expiration;
            }
            subscription.expiration = moment(subscription.expiration).add(subscription.extraDays, 'days').format();
            delete subscription.extraDays;
            subscription.$save();

            delete $scope.extraDays;
        };

        $scope.confirmResetSubscription = function(e, subscription) {
            var confirm = $mdDialog.confirm()
                .title(subscription.title)
                .content('Are you sure you want to reset me?')
                .ariaLabel('reset subscription ' + subscription.title)
                .ok('Reset subscription')
                .cancel("Nope.")
                .targetEvent(e);

            $mdDialog.show(confirm).then(function() {
                delete subscription.expiration;
                subscription.$save();
            }, function() {
                NotificationService.notify('Not reset.');

            });

        };

        $scope.confirmRemoveSubscription = function(e) {
            var confirm = $mdDialog.confirm()
                .title(subscription.title)
                .content('Are you sure you want to destroy me?')
                .ariaLabel('Delete subscription ' + subscription.title)
                .ok('Bye bye subscription!')
                .cancel("Maybe I'll need you later?")
                .targetEvent(e);

            $mdDialog.show(confirm).then(function() {
                return $scope.removeSubscription;
            }, function() {
                NotificationService.notify('Not destroyed!');
            });
        };

        $scope.removeSubscription = function() {
            userSubscriptionRef.$remove().then(function() {
                NotificationService.success('Removed', 'User Subscription')
            }, function(err) {
                NotificationService.error('Failed to Remove', err);
            });

            subscriptionRef.$remove().then(function() {
                NotificationService.success('Removed', 'Subscription Log')
            }, function(err) {
                NotificationService.error('Failed to Remove', err);
            });

            $state.go('authenticated.master.admin.subscriptions');

        };

    });