'use strict';

angular.module('quiverCmsApp')
  .controller('WordsCtrl', function ($scope, items, moderators, moment, NotificationService, Slug, $timeout, AdminService, $mdDialog, _) {
    $scope.items = items;

    $scope.moderators = moderators;

    // $scope.moderators.$loaded().then(function(moderators) {
    //   console.log('moderators', moderators);
    // });

    $scope.orderBy = '-$priority'

    /*
     * Words
    */
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

    $scope.createWord = function (title) {
      var author = $scope.user.public;

      _.defaults(author, {
        id: $scope.user.$id,
        name: $scope.user.email,
        email: $scope.user.email
      });

      items.$add({
        $priority: moment().unix(),
        title: title,
        slug: Slug.slugify(title),
        type: 'page',
        created: moment().format(),
        author: author
      }).then(function (ref) {
        delete $scope.newWordTitle;
        NotificationService.success('Created', 'Hi there ' + title + '.');
      });

    };

    $scope.setPriority = function (key, priority) {
      AdminService.getWord(key).$ref().setPriority(priority);      
    };

    $scope.setAuthor = function (userId, word, words) {
      var author = _.findWhere(moderators, {'$id': userId});
      word.author = _.omit(author, ['preferences']);
      word.author.id = author.$id;
      words.$save(word).then(function () {
        NotificationService.success('Set author');
      }, function (error) {
        NotificationService.error('Error setting author', error);
      });

    };

  });
