'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserCtrl', function ($scope, user, CommerceService) {

    user.$bindTo($scope, 'user');    

    $scope.getAddress = CommerceService.getAddress;

  });
