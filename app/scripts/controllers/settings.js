'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('SettingsCtrl', function($scope, landingPages, $timeout, $window, NotificationService, _, $mdColorPalette) {
        /*
         * Landing Pages
         */
        $scope.landingPages = landingPages;

        /*
         * Theme
         */
        $scope.mdColorPalette = $mdColorPalette;
        $scope.palettes = Object.keys($mdColorPalette);

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

        var requiredForCustomPalette = $scope.paletteKeys.concat([
            "contrastDarkColors",
            "contrastLightColors",
            "contrastDefaultColor"
        ]);

        var getTinyColor = function(value) {
            return tinycolor({
                r: value[0],
                g: value[1],
                b: value[2],
                a: value[3] || 1
            });
        };
        $scope.getHex = function(value) {
            return getTinyColor(value).toHexString();
        };

        $scope.getRgb = function(value) {
            return getTinyColor(value).toRgbString();
        };

        $scope.getOverrideStyle = function(type, index) {
            var style = "",
                overrides;
            if ($scope.theme && $scope.theme.palette && $scope.theme.palette.overrides && $scope.theme.palette.overrides[type]) {
                overrides = $scope.theme.palette.overrides[type];
                style += "background-color: #" + overrides[index] + ";";
                if (overrides.contrastDarkColors && ~Object.keys(overrides.contrastDarkColors).indexOf(index)) {
                    style += " color: rgba(0, 0, 0, .87)";
                } else if (overrides.contrastLightColors && ~Object.keys(overrides.contrastLightColors).indexOf(index)) {
                    style += " color: rgb(255, 255, 255)";
                } else if (overrides.contrastDefaultColor) {
                    if (overrides.contrastDefaultColor === 'light') {
                        style += " color: rgb(255, 255, 255)";
                    } else {
                        style += " color: rgba(0, 0, 0, .87)";
                    }
                }
            }
            return style;
        };

        $scope.loadTheme = function() {
            $window.location.reload();
        };

        $scope.deleteIntention = function(type, hue) {
            if ($scope.theme && $scope.theme.palette && $scope.theme.palette.intentions && $scope.theme.palette.intentions[type]) {
                delete $scope.theme.palette.intentions[type][hue];
            }
        };

        $scope.deleteOverride = function(type, hue) {
            if ($scope.theme && $scope.theme.palette && $scope.theme.palette.overrides && $scope.theme.palette.overrides[type]) {
                delete $scope.theme.palette.overrides[type][hue];
            }
        };

        $scope.validForCustomPalette = function(type) {
            if (!$scope.theme || !$scope.theme.palette || !$scope.theme.palette.overrides || !$scope.theme.palette.overrides[type]) {
                return false
            } else {
                var keys = Object.keys($scope.theme.palette.overrides[type]),
                    i = requiredForCustomPalette.length;
                while (i--) {
                    if (!~keys.indexOf(requiredForCustomPalette[i])) {
                        return false
                    }
                }
            }

            return true;
        };

        $scope.getPalette = function(type) {
            var palette;
            if ($scope.theme && $scope.theme.palette && $scope.theme.palette[type]) {
                palette = $scope.mdColorPalette[$scope.theme.palette[type]];
            } else if ($scope.validForCustomPalette(type)) {
                palette = $scope.theme.palette.overrides[type];
            } else {
                palette = $scope.mdColorPalette.indigo;
            }

            return _.map(palette, function(color, index) {
                color.index = index;
                return color;
            });
        };

        $scope.useCustomPalette = function(type) {
            if ($scope.theme && $scope.theme.palette && $scope.theme.palette[type]) {
                delete $scope.theme.palette[type];
            }
        };

        $scope.validateOverrides = function() {
            if ($scope.theme && $scope.theme.palette) {
                _.each($scope.theme.palette.overrides, function(overrides, type) {
                    _.each($scope.paletteKeys, function(key) {
                        if (!type[key] || typeof type[key] !== 'string') {
                            return delete type[key];
                        }
                    });
                    _.each(overrides.contrastDarkColors, function(value, key) {
                        if (!value) {
                            delete $scope.theme.palette.overrides[type].contrastDarkColors[key];
                        }
                    });
                    _.each(overrides.contrastLightColors, function(value, key) {
                        if (!value) {
                            delete $scope.theme.palette.overrides[type].contrastLightColors[key];
                        }
                    });
                });
            }
        };

        $scope.$watch('theme', $scope.validateOverrides, true);

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