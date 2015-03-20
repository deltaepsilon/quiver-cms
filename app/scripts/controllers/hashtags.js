'use strict';

angular.module('quiverCmsApp')
  .controller('HashtagsCtrl', function ($scope, hashtags, NotificationService, Slug, $timeout) {
    $scope.hashtags = hashtags;

    $scope.createHashtag = function (hashtag) {
      $timeout(function () {
        hashtag = hashtag.replace(/(#|\s)/g, '');

        $scope.hashtags.$add({
          value: hashtag,
          key: Slug.slugify(hashtag),
          creator: $scope.user.email
        }).then(function () {
            delete $scope.newHashtag;
            NotificationService.success('Hashtag Added');
          });
      });

    };

    $scope.removeHashtag = function (hashtag) {
      $scope.hashtags.$remove(hashtag).then(function () {
        NotificationService.success('Hashtag Removed');
      });
    };



  });
