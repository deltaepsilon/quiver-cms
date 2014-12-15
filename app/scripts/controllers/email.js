'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:EmailCtrl
 * @description
 * # EmailCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('EmailCtrl', function ($scope, AdminService, $sce, NotificationService) {
    $scope.send = function (email) {
      return AdminService.sendQueuedEmail(email);
    };

    $scope.sendFeedback = function () {
      $scope.loaded = false;
      return AdminService.sendQueuedFeedback().then(function () {
        $scope.loaded = true;
      }, function (err) {
        NotificationService.error('Send Feedback', err);
        $scope.loaded = true;
      });
    };

    $scope.trustHtml = function (html) {
      return $sce.trustAsHtml(html); 
    };

  });
