'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserCtrl', function ($scope, userRef) {
    $scope.user = userRef.$asObject();
    

  });
