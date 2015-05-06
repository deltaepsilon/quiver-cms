'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SubscriptionCtrl
 * @description
 * # SubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('UserSubscriptionCtrl', function($scope, subscription, pages, assignments, $stateParams, $localStorage, moment, NotificationService, _, $mdDialog) {
        /*
         * Subscription
         */
        $scope.subscription = subscription;

        $scope.isExpired = function(subscription) {
            return moment().unix() > moment(subscription.expiration).unix();
        };

        $scope.startSubscription = function(e, subscription) {
            if (!$scope.isExpired(subscription)) {
                var confirm = $mdDialog.confirm()
                    .title('Start subscription?')
                    .content('Are you ready to start your subscription?')
                    .ariaLabel('Start subscription.')
                    .ok("Start Subscription")
                    .cancel("Not Yet")
                    .targetEvent(e);

                $mdDialog.show(confirm).then(function() {
                    subscription.expiration = moment().add(subscription.subscriptionDays, 'days').format();
                    subscription.$save();
                    NotificationService.success('Subscription started!');
                }, function() {
                    NotificationService.notify('Subscription not started.');
                });

            } else {
                NotificationService.error('Subscription expired.');
            }

        };

        /*
         * Pages
         */
        $scope.pages = pages;

        /*
         * Assignments
         */

        $scope.assignments = assignments;
        $scope.startsSubscription = _.where(assignments, {
            startsSubscription: true
        });
        $scope.doesNotStartSubscription = _.filter(assignments, function(assignment) {
            return !assignment.startsSubscription;
        });

        // if (Object.keys(assignments.assignments).length) {
        //   $scope.assignments = assignments.assignments;
        //   $scope.startsSubscription = 
        // }
        // $scope.freeAssignments = Object.keys(assignments.assignments).length ? assignments.assignments : false;
        // $scope.limitedAssignments = Object.keys(assignments.assignments).length ? assignments.assignments : false;

    });