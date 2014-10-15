'use strict';

angular.module('quiverCmsApp')
  .controller('WordCtrl', function ($scope, $timeout, moment, wordRef, draftsRef, filesRef, NotificationService, $filter, $localStorage, _, ClipboardService, LocationService) {

    $scope.$storage = $localStorage;

    /*
     * Word
    */
    var word = wordRef.$asObject();

    word.$bindTo($scope, 'word');

    word.$loaded().then(function () {
      if (!$scope.$storage.activeDraft || $scope.$storage.activeDraft.wordId !== $scope.word.$id) {
        $scope.$storage.activeDraft = {
          markdown: $scope.word.published ? $scope.word.published.markdown : '#Use your words! \n\n(But please make it Markdown...)',
          created: moment().toDate(),
          wordId: $scope.word.$id
        };
      }

      $scope.showDraft = true;


    });

    $scope.clearExcerpt = function () {
      if ($scope.word.excerpt) {
        $scope.word.excerpt = "";

      }

    };

    $scope.makeKeyImage = function (file) {
      $scope.word.keyImage = file;
    };

    $scope.clearKeyImage = function () {
      if ($scope.word.keyImage) {
        delete $scope.word.keyImage;

      }

    };


    /*
     * Drafts
    */
    $scope.drafts = draftsRef.$asArray();

    $scope.saveDraft = function (draft) {
      draft.edited = moment().toDate();

      $scope.drafts.$add(draft).then(function () {
        NotificationService.success('Draft Saved', 'Saved as ' + $filter('date')(new Date(draft.created), 'medium'));
      });
    };

    $scope.removeDraft = function (draft) {
      $scope.drafts.$remove(draft).then(function () {
        NotificationService.success('Draft Deleted');
      });
    };

    $scope.makeActiveDraft = function (draft) {
      $scope.$storage.activeDraft = _.clone(draft);
      $scope.$storage.activeDraft.wordId = $scope.word.$id;

      NotificationService.success('Draft Activated', $filter('date')(new Date(draft.created), 'medium'));
    };

    $scope.setPublishedDraft = function (draft) {
      var datetime = moment().toDate();

      draft.edited = datetime;
      draft.published = datetime;
      $scope.word.published = draft;

    };

    $scope.unpublish = function () {
      delete $scope.word.published;
    };

    $scope.setEditedDatetime = function (draft) {
      draft.edited = moment().toDate();
    };

    $scope.handleActiveDraftChange = function (draft) {
      draft.edited = moment().toDate();
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

    var SUFFIX_REGEX = /\.(\w+)$/,
      imgList = ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'ico'],
      videoList = ['mp4', 'webm'];

    $scope.addFromClipboard = function (file) {
      var url = "https://s3.amazonaws.com/" + $scope.files.Name + "/" + file.Key,
        matches = file.Key.match(SUFFIX_REGEX),
        suffix = (matches && matches.length > 0) ? matches[1].toLowerCase() : null,
        isImg = !!~imgList.indexOf(suffix),
        isVideo = !!~videoList.indexOf(suffix),
        markdown = "\n\n";

      if (isImg) {
        markdown += '![' + $filter('filename')(file.Key) + '](' + url + ')';
      } else if (isVideo) {
        markdown += '!![' + $filter('filename')(file.Key) + '](' + url + ')';
      } else {
        markdown += '[' + $filter('filename')(file.Key) + '](' + url + ')';
      }

      $scope.$storage.activeDraft.markdown +=  markdown;

      NotificationService.success('Markdown Added');
    };

    /*
     * Location
    */
    $scope.getLocations = _.debounce(function (location) {
      var promise = LocationService.getLocations(location);

      promise.then(function (locations) {
        $scope.locations = locations;
      });
      return promise;
    }, 500);

    $scope.addLocation = function (location) {
      $scope.word.location = location;
    };

    $scope.removeLocation = function () {
      delete $scope.locationSearch;
      delete $scope.locations;
      delete $scope.word.location;
    };

    $scope.setPublishedDate = function (word, publishedDate) {
      word.published.published = moment(publishedDate).format();
    };

    $scope.resetPublishedDate = function (word) {
      $scope.publishedDate = moment(word.published.published).toDate();
    };

  });
