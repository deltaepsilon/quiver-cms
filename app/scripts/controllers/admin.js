'use strict';

angular.module('quiverCmsApp')
    .controller('AdminCtrl', function($scope, theme, settings, adminSettings, AdminService, ObjectService, NotificationService) {
        /*
         * Admin flag
         */
        $scope.isAdminView = true;

        /*
         * Theme
         */
        theme.$bindTo($scope, 'theme');
        ObjectService.toDestroy(theme);

        theme.$loaded().then(function(theme) {
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

        /*
         * Admin Settings
         */
        adminSettings.$bindTo($scope, 'adminSettings');

    });