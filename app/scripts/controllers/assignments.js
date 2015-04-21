'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AssignmentsCtrl
 * @description
 * # AssignmentsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('AssignmentsCtrl', function ($scope, items, NotificationService, moment, Slug, $mdDialog) {
    $scope.items = items;

    $scope.createAssignment = function (title) {
      items.$add({
        title: title,
        slug: Slug.slugify(title),
        created: moment().format()
      }).then(function (ref) {
        delete $scope.newAssignmentTitle;
        NotificationService.success('Created', 'Hi there ' + title + '.');
      });

    };

    $scope.confirmDelete = function (e, item, items) {
      var confirm = $mdDialog.confirm()
        .title(item.title)
        .content('Are you sure you want to eliminate me?')
        .ariaLabel('Delete ' + item.title)
        .ok('Please do it!')
        .cancel("Naah. Let's keep it.")
        .targetEvent(e);

      $mdDialog.show(confirm).then(function() {
        items.$remove(item).then(function () {
          NotificationService.success('Eliminated', item.title);
        }, function (error) {
          NotificationService.error('Something went wrong', error);
        });
      
      }, function() {
        NotificationService.notify('Not eliminated', 'You decided to save ' + item.title + '. How kind!');

      });
    };

  });
