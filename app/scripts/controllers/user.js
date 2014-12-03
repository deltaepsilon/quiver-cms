'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserCtrl', function ($scope, userRef, CommerceService) {
    var user = userRef.$asObject();

    user.$bindTo($scope, 'user');    

    $scope.getAddress = CommerceService.getAddress;

  });
