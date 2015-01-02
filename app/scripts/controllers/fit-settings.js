'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:FitSettingsCtrl
 * @description
 * # FitSettingsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('FitSettingsCtrl', function ($scope, settingsRef, movementsRef, bodyFocusesRef, equipmentRef, Slug) {
    /*
     * Settings
     */
    var settings = settingsRef.$asObject();

    settings.$bindTo($scope, 'settings');

    /*
     * Movements
     */
    var movements = movementsRef.$asArray();

    $scope.movements = movements;

    $scope.addMovement = function (name) {
      if (name && name.length) {
        $scope.movements.$add({
          name: name,
          slug: Slug.slugify(name)
        });

      }
      
    };

    $scope.removeMovement = function (movement) {
      $scope.movements.$remove(movement);
    };

    /*
     * Body Focuses
     */
    var bodyFocuses = bodyFocusesRef.$asArray();

    $scope.bodyFocuses = bodyFocuses;

    $scope.addBodyFocus = function (name) {
      if (name && name.length) {
        $scope.bodyFocuses.$add({
          name: name,
          slug: Slug.slugify(name)
        });

      }
      
    };

    $scope.removeBodyFocus = function (bodyFocus) {
      $scope.bodyFocuses.$remove(bodyFocus);
    };

    /*
     * Equipment
     */
    var equipment = equipmentRef.$asArray();

    $scope.equipment = equipment;

    $scope.addEquipment = function (name) {
      if (name && name.length) {
        $scope.equipment.$add({
          name: name,
          slug: Slug.slugify(name)
        });

      }
      
    };

    $scope.removeEquipment = function (item) {
      $scope.equipment.$remove(item);
    };

    $scope.levels = [
      {
        name: 'levelOne',
        description: 'Level One'
      },
      {
        name: 'levelTwo',
        description: 'Level Two'
      },
      {
        name: 'levelThree',
        description: 'Level Three'
      }
    ];
    
  });
