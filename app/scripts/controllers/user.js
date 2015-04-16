'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserCtrl', function ($scope, user, CommerceService, NotificationService) {

    user.$bindTo($scope, 'user');    

    $scope.getAddress = CommerceService.getAddress;

    $scope.removePaymentMethod = function (token) {
      CommerceService.removePaymentMethod(token).then(function (response) {
        if (response.error) {
          NotificationService.error('Card Error', response.error);
        } else {
          NotificationService.success('Card Removed');
        }
      }, function (err) {
        NotificationService.error('Card Error', err);
      });
    };

  });
