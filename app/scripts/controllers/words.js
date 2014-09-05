'use strict';

angular.module('quiverCmsApp')
  .controller('WordsCtrl', function ($scope, wordsRef, moment, NotificationService) {
    $scope.words = wordsRef.$asArray();

    $scope.removeWord = function (word) {
      var title = word.title;

      $scope.words.$remove(word).then(function () {
        NotificationService.success('Deleted', 'Bye bye ' + title + '!');
      }, function (error) {
        NotificationService.error('Delete Failed', 'Something is up!');
      });
    };

    $scope.createWord = function (title) {
      $scope.words.$add({
        title: title,
        type: 'page',
        created: moment().format(),
        author: {
          name: $scope.user.name || $scope.currentUser.id,
          email: $scope.user.email || $scope.currentUser.email,
        }
      }).then(function () {
        delete $scope.newWordTitle;
        NotificationService.success('Created', 'Hi there ' + title + '.');
      });

    };

    $scope.publishWord = function (word) {
      word.published = moment().format();
      word.edited = true;

    };

    $scope.unpublishWord = function (word) {
      delete word.published;
      word.edited = true;

    };

    $scope.saveWord = function (word) {
      delete word.edited;

      $scope.words.$save(word).then(function () {
        NotificationService.success('Saved', word.title);
      }, function (error) {
        NotificationService.error('Save Error', error);
      });

    };


  });
