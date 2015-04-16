'use strict';

angular.module('quiverCmsApp')
  .controller('AdminCtrl', function ($scope, theme, settings, adminSettings, AdminService, ObjectService, NotificationService) {

    /*
     * Theme
    */
    theme.$bindTo($scope, 'theme');
    ObjectService.toDestroy(theme);

    theme.$loaded().then(function (theme) {
      if (theme.options) {
        var keys = Object.keys($scope.theme.options);

        if (!$scope.theme.active && keys.length) {
          $scope.theme.active = keys[0];
        }

      }
      

    });

    /*
     * Settings
    */
    settings.$bindTo($scope, 'settings');

    $scope.setNavTitle = function (name, value) {
      $scope.settings[name + 'Title'] = value && value.length ? value : null;
    };

    $scope.addNavLink = function (type, link) {
      var list = $scope.settings[type];
      if (!list || !list.length || typeof list !== 'object') {
        list = [];
      }



      list.push(link);

      $scope.settings[type] = list;
    };

    $scope.removeNavLink = function (type, i) {
      var list = $scope.settings[type];
      list.splice(i, 1);

      settings[type] = list;
      settings.$save();

    };

    /*
     * Admin Settings
     */
    adminSettings.$bindTo($scope, 'adminSettings');

  });
