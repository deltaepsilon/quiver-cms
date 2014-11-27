'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SubscriptionCtrl
 * @description
 * # SubscriptionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SubscriptionCtrl', function ($scope, subscriptionRef, pages, $stateParams, $localStorage, moment, NotificationService) {
    $scope.subscription = subscriptionRef.$asObject();

    $scope.subscription.$loaded().then(function(subscription) {
    	if (subscription.subscriptionType === 'content') {
    		if (!$scope.subscription.expiration) {
    			$scope.subscription.expiration = moment().add(subscription.subscriptionDays, 'days').format();
    			$scope.subscription.$save();
    		} else if (moment().unix() > moment($scope.subscription.expiration).unix()) {
    			NotificationService.notify('Subscription Expired');
    			$scope.redirect();
    		}
    		
    	}
    	
    });

    $scope.pages = pages.pages;
    
  });
