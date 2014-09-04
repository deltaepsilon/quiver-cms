'use strict';

angular.module('quiverCmsApp')
  .controller('AuthenticatedCtrl', function ($scope, user) {
    $scope.user = user;
  });
