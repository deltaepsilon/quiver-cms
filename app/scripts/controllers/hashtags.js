'use strict';

angular.module('quiverCmsApp')
  .controller('HashtagsCtrl', function ($scope, hashtags, NotificationService, Slug, $timeout, $mdDialog) {
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

    $scope.confirmRemoveHashtag = function (e, item, items) {
      var name = item.value,
        confirm = $mdDialog.confirm()
          .title(name)
          .content('Are you sure you want to eliminate me?')
          .ariaLabel('Delete ' + name)
          .ok('Please do it!')
          .cancel("Naah. Let's keep it.")
          .targetEvent(e);

      $mdDialog.show(confirm).then(function() {
        items.$remove(item).then(function () {
          NotificationService.success('Eliminated', name);
        }, function (error) {
          NotificationService.error('Something went wrong', error);
        });
      
      }, function() {
        NotificationService.notify('Not eliminated', 'You decided to save ' + name + '. How kind!');

      });
    };

  });
