'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SettingsCtrl', function ($scope) {
    $scope.navList = [
      {
        name: "Nav #1",
        slug: "nav1"
      },
      {
        name: "Nav #2",
        slug: "nav2"
      },
      {
        name: "Nav #3",
        slug: "nav3"
      },
      {
        name: "Footer #1",
        slug: "footer1"
      },
      {
        name: "Footer #2",
        slug: "footer2"
      },
      {
        name: "Footer #3",
        slug: "footer3"
      },
      {
        name: "App #1",
        slug: "app1"
      },
      {
        name: "App #2",
        slug: "app2"
      },
      {
        name: "App #3",
        slug: "app3"
      },

    ];

  });
