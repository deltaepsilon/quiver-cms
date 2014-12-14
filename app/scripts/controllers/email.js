'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:EmailCtrl
 * @description
 * # EmailCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('EmailCtrl', function ($scope, AdminService, $sce) {
    $scope.send = function (email) {
      return AdminService.sendQueuedEmail(email);
    };

    $scope.trustHtml = function (html) {
      return $sce.trustAsHtml(html); 
    };

  });
