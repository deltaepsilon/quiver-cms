'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ExercisesCtrl
 * @description
 * # ExercisesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ExercisesCtrl', function ($scope, limit, exercisesRef, moment, Slug, NotificationService, _) {
    var exercises = exercisesRef.$asArray();
    $scope.exercises = exercises;

    $scope.added = [];

    $scope.create = function (title) {
      var slug = Slug.slugify(title),
        now = moment(),
        exercise = {
          $priority: slug,
          title: title,
          slug: slug,
          unix: now.unix(),
          created: now.format()
        };

      $scope.exercises.$add(exercise).then(function (ref) {
        exercise.$id = ref.key();
        $scope.added.push(exercise);
      }, function (err) {
        NotificationService.error('Create Failed', err);
      });
    };

    $scope.remove = function (exercise) {
      var i = exercises.length;

      while (i--) {
        if (exercises[i].$id === exercise.$id) {
          $scope.exercises.$remove(i).then(function (ref) {
            NotificationService.success('Deleted', ref.key());
          }, function (err) {
            exercise.disabled = false;
            NotificationService.error('Delete Failed', err);
          });
        }
      }
      
    };

    $scope.getPrev = function (exercises) {
      return {orderByPriority: true, limitToFirst: limit, startAt: exercises[exercises.length -1].slug};
    };

    $scope.getNext = function (exercises) {
      return {orderByPriority: true, limitToFirst: limit, endAt: exercises[0].slug};
    };

  });
