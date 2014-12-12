'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SubscriptionCtrl
 * @description
 * # SubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserSubscriptionCtrl', function ($scope, subscriptionRef, pages, assignments, $stateParams, $localStorage, moment, NotificationService) {
    /*
     * Subscription
     */
    $scope.subscription = subscriptionRef.$asObject();

    $scope.isExpired = function (subscription) {
        return moment().unix() > moment(subscription.expiration).unix();
    };

    $scope.startSubscription = function (subscription) {
        subscription.expiration = moment().add(subscription.subscriptionDays, 'days').format();
        subscription.$save();
    };

    $scope.checkSubscription = function (subscription) {
        if (subscription.subscriptionType === 'content') {
            if (!subscription.expiration) {
                subscription.expiration = moment().add(subscription.subscriptionDays, 'days').format();
                subscription.$save();
            } else if ($scope.isExpired(subscription)) {
                NotificationService.notify('Subscription Expired');
                return $scope.redirect();
            }
        }
        
    };

    $scope.subscription.$loaded().then(function(subscription) {
        $scope.checkSubscription(subscription);
    	
    });

    /*
     * Pages
     */
    $scope.pages = pages.pages;

    /*
     * Assignments
     */
    $scope.assignments = assignments.assignments;
    
  });
