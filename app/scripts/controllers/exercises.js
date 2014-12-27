'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ExercisesCtrl
 * @description
 * # ExercisesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ExercisesCtrl', function ($scope, exercisesRef, moment, Slug, NotificationService, _) {
    $scope.exercises = exercisesRef.$asArray();

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
      $scope.exercises.$remove(exercise.$id).then(function (ref) {
        NotificationService.success('Deleted', ref.key());
      }, function (err) {
        exercise.disabled = false;
        NotificationService.error('Delete Failed', err);
      });
    };

  });
