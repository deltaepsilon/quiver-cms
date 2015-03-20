'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SubscriptionCtrl
 * @description
 * # SubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserSubscriptionCtrl', function ($scope, subscription, pages, assignments, $stateParams, $localStorage, moment, NotificationService, _) {
    /*
     * Subscription
     */
    $scope.subscription = subscription;

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
    $scope.pages = pages;

    /*
     * Assignments
     */

    $scope.assignments = assignments;
    $scope.startsSubscription = _.where(assignments, {startsSubscription: true});
    $scope.doesNotStartSubscription = _.filter(assignments, function (assignment) {
      return !assignment.startsSubscription;
    });
    // if (Object.keys(assignments.assignments).length) {
    //   $scope.assignments = assignments.assignments;
    //   $scope.startsSubscription = 
    // }
    // $scope.freeAssignments = Object.keys(assignments.assignments).length ? assignments.assignments : false;
    // $scope.limitedAssignments = Object.keys(assignments.assignments).length ? assignments.assignments : false;
    
  });
