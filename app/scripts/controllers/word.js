'use strict';

angular.module('quiverCmsApp')
  .controller('WordCtrl', function ($scope, $q, $timeout, moment, word, drafts, files, hashtags, wordHashtags, Slug, NotificationService, $filter, $localStorage, _, ClipboardService, LocationService, env) {

    $scope.$storage = $localStorage;

    /*
     * Word
    */
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
    $scope.drafts = drafts;

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
    $scope.files = files;

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

    /*
     * Hashtags
     */
    $scope.hashtags = hashtags;
    $scope.wordHashtags = _.toArray(wordHashtags);
    $scope.searchText = null;
    $scope.selectedHashtag = null;

    $scope.searchHashtags = function (searchText) {
      return _.filter($scope.hashtags, function (hashtag) {
        return !!hashtag.key.match(new RegExp(searchText, 'i')) && !_.findWhere(wordHashtags, {key: hashtag.key});
      });

    };

    $scope.handleHashtagChange = function (word) {
      console.log('handleHashtagChange', word);
    };

    $scope.addHashtag = function (chip) {
      var promise;

      if (typeof chip === 'string' && !_.findWhere(wordHashtags, {key: chip.toLowerCase()})) {
        promise = wordHashtags.$add({
          key: Slug.slugify(chip),
          value: chip
        });

      } else if (typeof chip === 'object'  && !_.findWhere(wordHashtags, {key: chip.key})) {
        promise = wordHashtags.$add({
          key: chip.key,
          value: chip.value
        });

      }

      if (promise) {
        promise.then(function () {
          NotificationService.success('Hashtag added', chip.key || chip);
        }, function (err) {
          NotificationService.error('Hashtag failed', chip.key || chip + ' ' + err);
        });
      }
      
    };

    $scope.$watch('wordHashtags', function () {
      console.log('wordHashtags changed', $scope.wordHashtags, wordHashtags);
      var i = wordHashtags.length,
        deletePromises = [],
        dupePromises = [],
        deferred = $q.defer();

      while (i--) {
        if (!_.findWhere($scope.wordHashtags, {key: wordHashtags[i].key})) {
          deletePromises.push(wordHashtags.$remove(wordHashtags[i]));
        }
      }

      $q.all(deletePromises).then(function () {
        var grouped = _.groupBy(wordHashtags, function (hashtag) {
          return hashtag.key;
        });
        _.each(grouped, function (group) {
          var j = group.length - 1;
          while (j--) {
            dupePromises.push(wordHashtags.$remove(wordHashtags.$indexFor(group[j].$id)));
          }
        });

        $q.all(dupePromises).then(deferred.resolve, deferred.reject);

      });

      return deferred.promise;
      
    }, true);

    wordHashtags.$watch(function (e) {
      $scope.wordHashtags = _.toArray(wordHashtags);
    });

  });
