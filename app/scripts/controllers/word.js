'use strict';

angular.module('quiverCmsApp')
  .controller('WordCtrl', function ($scope, $timeout, moment, wordRef, draftsRef, filesRef, NotificationService, $filter, $localStorage, _, ClipboardService) {

    $scope.$storage = $localStorage;

    /*
     * Word
    */
    var word = wordRef.$asObject();

    word.$bindTo($scope, 'word');

    word.$loaded().then(function () {
      if (!$scope.$storage.activeDraft || $scope.$storage.activeDraft.key || $scope.word.$id) {
        $scope.$storage.activeDraft = {
          markdown: $scope.word.published ? $scope.word.published.markdown : '#Use your words! \n\n(But please make it Markdown...)',
          created: moment().format()
        };
      }


    });


    /*
     * Drafts
    */
    $scope.drafts = draftsRef.$asArray();

    $scope.saveDraft = function (draft) {
      draft.edited = moment().format();

      $scope.drafts.$add(draft).then(function () {
        NotificationService.success('Draft Saved', 'Saved as ' + $filter('date')(draft.created, 'medium'));
      });
    };

    $scope.removeDraft = function (draft) {
      $scope.drafts.$remove(draft).then(function () {
        NotificationService.success('Draft Deleted');
      });
    };

    $scope.makeActiveDraft = function (draft) {
      $scope.$storage.activeDraft = _.clone(draft);

      NotificationService.success('Draft Activated', $filter('date')(draft.created, 'medium'));
    };

    $scope.setPublishedDraft = function (draft) {
      var datetime = moment().format();

      draft.edited = datetime;
      draft.published = datetime;
      $scope.word.published = draft;

    };

    $scope.unpublish = function () {
      delete $scope.word.published;
    };

    $scope.setEditedDatetime = function (draft) {
      draft.edited = moment().format();
    };

    $scope.handleActiveDraftChange = function (draft) {
      draft.edited = moment().format();
    };

    /*
     * Files
    */
    $scope.files = filesRef.$asObject();

    $scope.removeFromClipboard = function (file) {
      var fileName = $filter('filename')(file.Key);

      if (ClipboardService.remove(file, $scope)) {
        return NotificationService.success('- Clipboard', fileName + ' has been removed from the clipboard.');
      } else {
        return NotificationService.error('Not Found', fileName + ' was not found in the clipboard');
      }

    };
  });
