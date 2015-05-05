'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('SettingsCtrl', function($scope, landingPages, $timeout) {
        /*
         * Landing Pages
         */
        $scope.landingPages = landingPages;

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