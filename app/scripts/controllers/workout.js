'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:WorkoutCtrl
 * @description
 * # WorkoutCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('WorkoutCtrl', function ($scope, settingsRef, exercisesRef, FitService, _) {
    /*
     * Settings
     */
    var settings = settingsRef.$asObject();

    $scope.settings = settings;

    /*
     * Exercises
     */
    var exercises = exercisesRef.$asArray();

    /*
     * Workout
     */

    $scope.validateEquipment = function (item, preferences) {
      var items = Object.keys(preferences.equipment);

      if (~items.indexOf('none')) {
        if (item.slug === 'none') {
          preferences.equipment = {'none': true};
        } else {
          delete preferences.equipment.none;
        }

      }

    };

    $scope.generateWorkout = function (preferences) {
      var equipment = _.uniq(['none'].concat(Object.keys(preferences.equipment))),
        filtered = _.filter(exercises, function (exercise) {
          if (exercise.type !== preferences.type) {
            return false;
          }

          if (!~equipment.indexOf(exercise.equipment || 'none')) {
            return false;
          }

          return true;

        }),
        shuffled = _.shuffle(filtered),
        grouped = _.groupBy(shuffled, function (exercise) {
          return exercise.bodyFocus || 'cardio';
        }),
        sorted = (function (grouped) {
          var result = [],
            keys = Object.keys(grouped),
            groupCount = keys.length,
            i = keys.length,
            group,
            j;

          while (i--) {
            group = grouped[keys[i]];
            j = group.length;

            while (j--) {
              result[i + j * groupCount] = group[j];
            }
            
          }

          return _.compact(result);

        })(grouped);

      // _.each(sorted, function (exercise) {
      //   console.log(exercise);
      // });

      $scope.workout = {
        exercises: sorted,
        preferences: preferences
      };
      
    };

    $scope.types = FitService.types;

    $scope.levels = FitService.levels;

    $scope.durations = FitService.durations;

    $scope.preferences = {
      type: $scope.types[0].name,
      intensity: $scope.levels[1].name,
      duration: $scope.durations[2].value,
      equipment: {
        'none': true
      },
      bodyFocus: 'full-body'

    };

  });
