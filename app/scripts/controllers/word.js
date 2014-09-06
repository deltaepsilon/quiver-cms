'use strict';

angular.module('quiverCmsApp')
  .controller('WordCtrl', function ($scope, $timeout, moment, wordRef, draftsRef, NotificationService, $filter) {

    /*
     * Word
    */
    var word = wordRef.$asObject();

    word.$bindTo($scope, 'word');

    word.$loaded().then(function () {
      if (!$scope.word.markdown || !$scope.word.markdown.length) {
        $timeout(function () {
          $scope.word.markdown = '#Use your words! \n\n(But please make it Markdown...)';
        })

      }
    });


    /*
     * Drafts
    */
    $scope.drafts = draftsRef.$asArray();

    $scope.saveDraft = function (markdown) {
      var draft = {
        markdown: markdown,
        created: moment().format()
      };

      $scope.drafts.$add(draft).then(function () {
        NotificationService.success('Draft Saved', 'Saved as ' + $filter('date')(draft.created, 'medium'));
      });
    };

    $scope.makeActiveDraft = function (draft) {
      $scope.word.markdown = draft.markdown;

      NotificationService.success('Draft Activated', $filter('date')(draft.created, 'medium'));
    };
  });
