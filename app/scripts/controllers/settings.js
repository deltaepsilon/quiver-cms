'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('SettingsCtrl', function($scope, landingPages, $timeout, $window, NotificationService) {
        /*
         * Landing Pages
         */
        $scope.landingPages = landingPages;

        /*
         * Theme
         */
        $scope.palettes = [
            "red",
            "pink",
            "purple",
            "deep-purple",
            "indigo",
            "blue",
            "light-blue",
            "cyan",
            "teal",
            "green",
            "light-green",
            "lime",
            "yellow",
            "amber",
            "orange",
            "deep-orange",
            "brown",
            "grey",
            "blue-grey"
        ];

        $scope.paletteKeys = [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
            "A100",
            "A200",
            "A300",
            "A400",
            "A700"
        ];

        $scope.paletteHues = [
            "default",
            "hue-1",
            "hue-2",
            "hue-3"
        ];

        $scope.loadTheme = function () {
            $window.location.reload();
        };

        $scope.deleteOverride = function (type, hue) {
            if ($scope.theme && $scope.theme.palette && $scope.theme.palette.overrides) {
                delete $scope.theme.palette.overrides[type][hue];    
            }
        };

        /*
         * Nav Lists
         */
        $scope.navList = [{
                name: "Nav #1",
                slug: "nav1"
            }, {
                name: "Nav #2",
                slug: "nav2"
            }, {
                name: "Nav #3",
                slug: "nav3"
            }, {
                name: "Footer #1",
                slug: "footer1"
            }, {
                name: "Footer #2",
                slug: "footer2"
            }, {
                name: "Footer #3",
                slug: "footer3"
            }, {
                name: "App #1",
                slug: "app1"
            }, {
                name: "App #2",
                slug: "app2"
            }, {
                name: "App #3",
                slug: "app3"
            },

        ];

        $scope.cleanNavArray = function(nav) {
            $timeout(function() {
                var i = nav.length;

                while (i--) {
                    if (!nav[i] || !nav[i].href || !nav[i].text) {
                        nav.splice(i, 1);
                    }
                }
            });

        };

        $scope.addNavLink = function(type, link) {
            var list = $scope.settings[type];
            if (!list || !list.length || typeof list !== 'object') {
                list = [];
            }



            list.push(link);

            $scope.settings[type] = list;
        };

        $scope.removeNavLink = function(type, i) {
            var list = $scope.settings[type];
            list.splice(i, 1);

            settings[type] = list;
            settings.$save();

        };

    });