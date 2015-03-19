'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AssignmentsCtrl
 * @description
 * # AssignmentsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('AssignmentsCtrl', function ($scope, assignments, NotificationService, moment, Slug) {
    $scope.assignments = assignments;

    $scope.createAssignment = function (title) {
      $scope.assignments.$add({
        title: title,
        slug: Slug.slugify(title),
        created: moment().format()
      }).then(function (ref) {
        ref.setPriority(100000);
        delete $scope.newAssignmentTitle;
        NotificationService.success('Created', 'Hi there ' + title + '.');
      });

    };

    $scope.removeAssignment = function (assignment) {
      $scope.assignments.$remove(assignment);
    };

  });
