'use strict';

angular.module('quiverCmsApp')
  .controller('AdminCtrl', function ($scope, themeRef, settingsRef) {
    var theme = themeRef.$asObject(),
      settings = settingsRef.$asObject();

    /*
     * Theme
    */
    theme.$bindTo($scope, 'theme');

    theme.$loaded().then(function () {
      var keys = Object.keys($scope.theme.options);

      if (!$scope.theme.active && keys.length) {
        $scope.theme.active = keys[0];
      }
    });

    /*
     * Settings
    */
    settings.$bindTo($scope, 'settings');

    $scope.addNavLink = function (type, link) {
      var list = $scope.settings[type];
      if (!list || !list.length) {
        list = [];
      }



      list.push(link);

      $scope.settings[type] = list;
    };

    $scope.removeNavLink = function (type, i) {
      $scope.settings[type].splice(i, 1);
    };

  });
