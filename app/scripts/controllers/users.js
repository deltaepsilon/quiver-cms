'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UsersCtrl', function ($scope, usersRef) {
    $scope.users = usersRef.$asArray();
    
  });
