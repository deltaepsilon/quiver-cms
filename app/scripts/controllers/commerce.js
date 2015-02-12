'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:CommerceCtrl
 * @description
 * # CommerceCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('CommerceCtrl', function ($scope, commerceRef, countries, states, ShipmentService, $localStorage) {

    /*
     * localStorge
     */
    $scope.$storage = $localStorage;

    /*
     * Commerce
    */
    var commerce = commerceRef.$asObject();

    commerce.$bindTo($scope, 'commerce');

    /*
     * Countries
    */
    $scope.countries = countries;

    $scope.checkAllCountries = function () {
      if (!$scope.commerce.countries) {
        $scope.commerce.countries = {};
      }
      
      _.each(countries, function (country) {
        if (!$scope.commerce.countries[country['alpha-2']]) {
          $scope.commerce.countries[country['alpha-2']] = {};
        }

        $scope.commerce.countries[country['alpha-2']].enabled = true;

      });

    };

    $scope.uncheckAllCountries = function () {
      if (!$scope.commerce.countries) {
        $scope.commerce.countries = {};
      }

      _.each(countries, function (country) {
        if ($scope.commerce.countries[country['alpha-2']] && $scope.commerce.countries[country['alpha-2']].enabled) {
          $scope.commerce.countries[country['alpha-2']].enabled = false;
        }
      });
    };

    /*
     * States
    */
    $scope.states = states;

    $scope.checkAllStates = function () {
      if (!$scope.commerce.states) {
        $scope.commerce.states = {};
      }

      _.each(states, function (state) {
        if (!$scope.commerce.states[state.abbreviation]) {
          $scope.commerce.states[state.abbreviation] = {};
        }

        $scope.commerce.states[state.abbreviation].enabled = true;

      });

    };

    $scope.uncheckAllStates = function () {
      if (!$scope.commerce.states) {
        $scope.commerce.states = {};
      }

      _.each(states, function (state) {
        if ($scope.commerce.states[state.abbreviation] && $scope.commerce.states[state.abbreviation].enabled) {
          $scope.commerce.states[state.abbreviation].enabled = false;
        }
      });
    };

    /*
     * From Address
     */
    $scope.createAddress = function (address) {
      return ShipmentService.createAddress(address).then(function (response) {
        if (response.message) {
          NotificationService.notify(response.message);
        }

        if (response.address) {
          if (!$scope.$storage.shipment) {
            $scope.$storage.shipment = {};
          }
          $scope.$storage.shipment.fromAddress = response.address;
        }

      });

    };

  });
