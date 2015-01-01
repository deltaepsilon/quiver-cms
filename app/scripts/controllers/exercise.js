'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ExerciseCtrl
 * @description
 * # ExerciseCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ExerciseCtrl', function ($scope, exerciseRef, fitSettingsRef, Slug) {
    /*
     * Exercise
     */
    var exerciseLoaded = false,
      exercise = exerciseRef.$asObject();

    exercise.$bindTo($scope, 'exercise');

    exercise.$loaded().then(function () {
      exerciseLoaded = true;

      $scope.validate();
    });

    /*
     * Settings
     */
    var settingsLoaded = false,
      fitSettings = fitSettingsRef.$asObject();

    $scope.fitSettings = fitSettings;

    fitSettings.$loaded().then(function () {
      settingsLoaded = true;

      $scope.validate();
    });

    /*
     * Validation
     */
    $scope.validate = function () {
      if (exerciseLoaded && settingsLoaded) {
        var exercise = $scope.exercise;

        // Slug
        exercise.slug = Slug.slugify(exercise.slug || exercise.title);

        // Equipment
        if (!exercise.equipment) {
          var equipmentKeys = Object.keys($scope.fitSettings.equipment);

          exercise.equipment = $scope.fitSettings.equipment[equipmentKeys[0]].slug;
        }

        if (exercise.type === 'strength') {
          if (!exercise.movement || !exercise.bodyFocus || !exercise.equipment) {
             return false;
          }

          if (!exercise.levels) {
            return false;
          }

          var levels = {'one': 'levelOne', 'two': 'levelTwo', 'three': 'levelThree'},
            levelKeys = Object.keys(levels),
            i = levelKeys.length,
            levelKey,
            level;

          while (i--) {
            levelKey = levelKeys[i];
            level = levels[levelKey];

            if (exercise.levels[levelKey]) {
              if (!exercise[level] || !exercise[level].reps || !exercise[level].reps.min || !exercise[level].reps.max) {
                return false;  
              }

              if (!exercise[level].video || !exercise[level].video.primary) {
                return false;
              }

              if (exercise.side && !exercise[level].video.secondary) {
                return false;
              }
              
            }


          }

        }

        if (exercise.type === 'hiit') {
          if (!exercise.bodyFocus || !exercise.equipment || !exercise.level) {
             return false;
          }

          if (!exercise.standard || !exercise.standard.reps || !exercise.standard.reps.min || !exercise.standard.reps.max || !exercise.standard.video) {
            return false;
          }

          if (!exercise.long || !exercise.long.reps || !exercise.long.reps.min || !exercise.long.reps.max || !exercise.long.video) {
            return false;
          }

          
        }

        if (exercise.type == 'cardio') {
          if (!exercise.levelOne || !exercise.levelOne.video.primary) {
            return false;
          }

          if (!exercise.levelTwo || !exercise.levelTwo.video.primary) {
            return false;
          }

        }

      }

      return true;
      
    };

  });
