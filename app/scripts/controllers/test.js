'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:TestCtrl
 * @description
 * # TestCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('TestCtrl', function($scope, $timeout, $interval, AdminService, moment, _) {
        $scope.logEnv = function() {
            console.log($scope.env);
            $scope.logEnvShow = true;
            $timeout(function() {
                $scope.logEnvShow = false;
            }, 2000);
        };

        $scope.logDiscounts = function() {
            AdminService.getTest('discounts').then(function(discounts) {
                $scope.logDiscountsMessage = 'Discounts logged!';
                _.each(discounts, function(discount, key) {
                    if (discount && discount.code) {
                        console.log(key, discount.code);
                    }
                });
            }, function(err) {
                console.warn(err);
            }).finally(function() {
                $timeout(function() {
                    delete $scope.logDiscountsMessage;
                }, 2000);
            });
        };

        $scope.testTimeout = function() {

            var start = moment().unix(),
                promise = $interval(function() {
                    $scope.testTimeoutMessage = (moment().unix() - start) + ' seconds...'
                }, 200);

            AdminService.getTest('timeout').then(function(status) {
                $scope.testTimeoutMessage = 'Returned status: ' + status + ' after ' + (moment().unix() - start) + ' seconds.';
            }, function(err) {
                console.warn(err);
                $scope.testTimeoutMessage = 'Returned status: ' + err.statusText + ' after ' + (moment().unix() - start) + ' seconds.';
            }).finally(function() {
                $interval.cancel(promise);
            });
        };

    });