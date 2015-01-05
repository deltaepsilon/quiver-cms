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
      
      var getExercise = function () {
          var exercise = sorted.shift();
          sorted.push(exercise);
          return exercise;
        },
        level = settings[preferences.type][preferences.intensity],
        circuitTypes = _.sortBy(FitService.circuitTypes, function (type) { return type.priority || 0; }),
        secondsMax = preferences.duration * 60,
        circuit = {
          flat: [],
          grouped: [],
          seconds: 0
        },
        type,
        last;

      while (circuit.seconds <= secondsMax) {
        type = circuitTypes.shift();
        circuitTypes.push(type);

        circuit.grouped.push({
          type: type,
          exercises: {},
          duration: 0
        });

        var group = circuit.grouped[circuit.grouped.length - 1],
          slots = type.name.split(''),
          sets = type.name === 'abcd' ? level.sets.min : level.sets.max,
          setRest = type.name === 'abcd' ? level.rest.min : level.rest.max,
          exerciseRest = level.rest.exercise,
          exerciseDuration = FitService.video.duration,
          last = true,
          flat = [],
          flatIndex,
          exercise,
          slotsLength = slots.length,
          j = slotsLength,
          k;
        

        while (j--) {
          exercise = getExercise();
          exercise.duration = exerciseDuration;
          exercise.rest = exerciseRest;
          exercise.last = last;
          last = false;

          group.exercises[slots[j]] = exercise;


          k = sets - 1;
          while (k--) {
            flatIndex = j + k * slotsLength;
            flat[flatIndex] = _.clone(exercise);
            // flat.splice(1 + flatIndex, 0, {type: 'rest', duration: last ? setRest : exerciseRest});
          }

        }

        var l = flat.length;

        while (l--) {
          flat.splice(l + 1, 0, {type: 'rest', title: 'Rest', duration: flat[l].last ? setRest : exerciseRest});
        }

        _.each(flat, function (activity) {
          if (activity) {
            group.duration += activity.duration;
            circuit.seconds += activity.duration;
          }
          
        });
        

        circuit.flat = circuit.flat.concat(flat);

      }     

      var cumulativeDuration = 0;

      _.each(circuit.flat, function (exercise) {
        cumulativeDuration += exercise.duration;
        exercise.cumulativeDuration = cumulativeDuration;
      });

      if (circuit.flat[circuit.flat.length - 1].type === 'rest') {
        circuit.flat.splice(circuit.flat.length - 1, 1);
      }

      $scope.workout = {
        exercises: sorted,
        circuit: circuit,
        preferences: preferences
      };

      console.log($scope.workout);

      // _.each(sorted, function (exercise) {
      //   console.log(exercise);
      // });
      
    };

    $scope.$id = function (item) {
      console.log(item.index);
      return item.index;
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
