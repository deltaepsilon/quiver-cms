'use strict';

angular.module('quiverCmsApp')
  .controller('WordCtrl', function ($scope, $timeout, moment, wordRef, draftsRef, filesRef, NotificationService, $filter, $localStorage, _, ClipboardService, LocationService, env) {

    $scope.$storage = $localStorage;

    /*
     * Word
    */
    var word = wordRef.$asObject();

    word.$bindTo($scope, 'word');

    word.$loaded().then(function () {
      if (!$scope.$storage.activeDraft || $scope.$storage.activeDraft.wordId !== $scope.word.$id) {
        $scope.$storage.activeDraft = {
          markdown: $scope.word.published ? $scope.word.published.markdown : '#Use your words! \n\n(But please make it [CommonMark](http://commonmark.org)...)',
          created: moment().format(),
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
      draft.edited = moment().format();

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
      var datetime = moment().format();

      draft.edited = datetime;
      if ($scope.word.published && $scope.word.published.published) {
        draft.published = $scope.word.published.published;
      } else {
        draft.published = datetime;
      }

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

    var SUFFIX_REGEX = /\.(\w+)$/,
      imgList = env.supportedImageTypes,
      videoList = env.supportedVideoTypes;

    $scope.addFromClipboard = function (file) {
      var key = env.imageSizes.postSize && file.Versions[env.imageSizes.postSize] ? file.Versions[env.imageSizes.postSize].Key : file.Key,
        url = "https://s3.amazonaws.com/" + $scope.files.Name + "/" + key,
        matches = file.Key.match(SUFFIX_REGEX),
        suffix = (matches && matches.length > 0) ? matches[1].toLowerCase() : null,
        isImg = !!~imgList.indexOf(suffix),
        isVideo = !!~videoList.indexOf(suffix),
        markdown = "\n\n",
        html = "\n\n";

      if ($scope.useHtml) {
        if (isImg) {
          html += '<a title="' + $filter('filename')(key) + '" href="' + url + '" target="_blank"><img alt="' + $filter('filename')(key) + '" src="' + url + '"/></a>';
        } else if (isVideo) {
          html += '<a title="' + $filter('filename')(key) + '" href="' + url + '" target="_blank"><video alt="' + $filter('filename')(key) + '" src="' + url + '"/></a>';
        } else {
          html += '<a title="' + $filter('filename')(key) + '" href="' + url + '" target="_blank">' + $filter('filename')(key) + '</a>';
        }  
        $scope.$storage.activeDraft.html +=  html;  
        NotificationService.success('Html added');
      } else {
        if (isImg) {
          markdown += '![' + $filter('filename')(key) + '](' + url + ')';
        } else if (isVideo) {
          markdown += '!![' + $filter('filename')(key) + '](' + url + ')';
        } else {
          markdown += '[' + $filter('filename')(key) + '](' + url + ')';
        }  
        $scope.$storage.activeDraft.markdown +=  markdown;
        NotificationService.success('Markdown added');
      }
      
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
