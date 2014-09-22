'use strict';

angular.module('quiverCmsApp')
  .controller('AdminCtrl', function ($scope, themeRef) {
    var theme = themeRef.$asObject();

    theme.$bindTo($scope, 'theme');

    theme.$loaded().then(function () {
      var keys = Object.keys($scope.theme.options);

      if (!$scope.theme.active && keys.length) {
        $scope.theme.active = keys[0];
      }
    });
  });
