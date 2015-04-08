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
     * Right nav must stay closed when leaving this state.
     */
    var off = $scope.$on('$stateChangeStart', function () {
      $scope.closeSidenav('right');
      return !$scope.showTOC() ? off() : false;

    });

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
