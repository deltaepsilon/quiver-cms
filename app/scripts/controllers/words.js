'use strict';

angular.module('quiverCmsApp')
  .controller('WordsCtrl', function ($scope, words, moment, NotificationService, Slug, $timeout, AdminService, $mdDialog) {
    /*
     * Words
    */
    // $scope.limit = limit;
    var words = words;

    // $scope.loadMore = function (increment) {
    //   $scope.limit += (increment || limit);

    //   words = AdminService.getWords({orderByPriority: true, limitToFirst: $scope.limit});
    //   words.$loaded().then(function (words) {
    //     words = words;
    //   });

    // };

    // $scope.setQuery = function (field, query) {
    //   var value = query[field], 
    //     options = {orderByChild: field, startAt: value};

    //   $scope.limit = limit;

    //   if (!value || !value.length) {
    //     options = {orderByPriority: true, limitToFirst: $scope.limit}; 
    //   }

    //   words = AdminService.getWords(options);
    //   words.$loaded().then(function (words) {
    //     words = words;
    //   });
      
      
    // };

    // words.$loaded().then(function (words) {
    //   var i = words.length;

    //   while (i--) {
    //     console.log('word', words[i].$id, words[i].$priority, moment(words[i].created).unix());
    //     $scope.setPriority(words[i].$id, moment(words[i].created).unix());
    //   }
    // });

    $scope.getPriority = function (word) {
      if ($scope.searching !== true && word && word.$priority) {
        // console.log('word.$priority', word.$priority);
        return word.$priority;

      } else if (!word.$id) {
        return 'zzzz';
      }
      return -1;
      
    };

    $scope.endAt = function (words) {
      var firstItem = words[0];
      $scope.searching = true;
      return firstItem.$priority ? firstItem.$priority : undefined;
    };

    $scope.startAt = function (words) {
      var lastItem = words[words.length - 1];
      $scope.searching = true;
      return lastItem.$priority ? lastItem.$priority + 1 : null;
    };

    $scope.getTypeQuery = function (type) {
      return type ? {orderByChild: 'type', equalTo: type} : {orderByPriority: true};
    };

    $scope.getSlugQuery = function (slug) {
      $scope.searching = true;
      return slug ? {orderByChild: 'slug', startAt: slug} : {orderByPriority: true};
    };

    $scope.confirmDelete = function (e, word) {
      var confirm = $mdDialog.confirm()
        .title(word.title)
        .content('Are you sure you want to eliminate me?')
        .ariaLabel('Delete ' + word.title)
        .ok('Please do it!')
        .cancel("Naah. Let's keep it.")
        .targetEvent(e);

      $mdDialog.show(confirm).then(function() {
        $scope.removeWord(word).then(function () {
          NotificationService.success('Eliminated', word.title);
        }, function (error) {
          NotificationService.error('Something went wrong', error);
        });
      
      }, function() {
        NotificationService.notify('Not eliminated', 'You decided to save ' + word.title + '. How kind!');

      });
    };

    $scope.removeWord = function (word) {
      return AdminService.getWord(word.$id).$remove();
    };

    $scope.createWord = function (title) {
      var author = $scope.user.public;

      _.defaults(author, {
        id: $scope.user.$id,
        name: $scope.user.email,
        email: $scope.user.email
      });

      words.$add({
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

  });
