'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:FindAssignmentCtrl
 * @description
 * # FindAssignmentCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('FindAssignmentCtrl', function($scope, assignment, subscriptions, $state, $stateParams, $localStorage, UserService, NotificationService, _, moment) {
        var productSlugs = assignment ? Object.keys(assignment.products) : [],
            goTo = function(assignmentKey, subscriptionKey) {
                $state.go('authenticated.master.subscription.assignment', {
                    assignmentKey: assignmentKey,
                    subscriptionKey: subscriptionKey
                });
            };

        $scope.slug = $stateParams.slug;

        $scope.assignment = assignment;


        $scope.subscriptions = _.filter(subscriptions, function(subscription) {
            return ~productSlugs.indexOf(subscription.slug);
        });

        $scope.isExpired = function(subscription) {
            return moment().unix() > moment(subscription.expiration).unix();
        };

        $scope.willStartSubscription = function(subscription) {
            return !!$scope.assignment.startsSubscription && !subscription.expiration;
        };

        /*
         * Four states
         * 1. Interaction-triggered and not started
         * 2. Interaction-triggered and started
         * 3. Interaction-triggered and expired
         * 4. Content-triggered and not started
         * 5. Content-triggered and started
         * 6. Content-triggered and expired
         */

        $scope.goToAssignment = function(assignment, subscription) {
            UserService.getSubscription($scope.user.public.id, subscription.$id).$loaded().then(function(subscription) {
                if (assignment.startsSubscription && $scope.willStartSubscription(subscription) && !subscription.expiration) {
                    $scope.freezeButtonText = true;
                    subscription.expiration = moment().add(subscription.subscriptionDays, 'days').format();
                    subscription.$save().then(function() {
                        goTo(assignment.$id, subscription.$id);
                    });
                    NotificationService.success('Subscription started!');

                } else {
                    goTo(assignment.$id, subscription.$id);
                }

            });

        };

        var setDefaultSubscription = function(subscriptions) {
            var i = subscriptions.length,
                subscription = _.findWhere($scope.subscriptions, {
                    '$id': $localStorage.lastSubscriptionKey
                });

            if (subscription && !$scope.isExpired(subscription)) {
                $scope.subscription = subscription;
            } else {
                while (i--) {
                    subscription = subscriptions[i];
                    if (!$scope.isExpired(subscription)) {
                        return $scope.subscription = subscription;
                    }
                }
            }

        };

        setDefaultSubscription($scope.subscriptions);

        if (assignment && assignment.subscriptionType === 'content' && $scope.subscription) {
            return goTo(assignment.$id, $scope.subscription.$id);
        }

        console.log($scope.assignment);
        console.log($scope.subscriptions);
    });