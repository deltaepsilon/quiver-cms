'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:MessagesCtrl
 * @description
 * # MessagesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('MessagesCtrl', function ($scope, limit, messagesRef, AdminService, $stateParams) {
    /*
     * Messages
     */
    var messages = messagesRef.$asArray();
    $scope.messages = messages;

    /*
     * Query
     */
    var query = function (q) {
      var q = q || {orderByPriority: true, limitToLast: $scope.limit};

      messagesRef = AdminService.getMessages(q);
      messages = messagesRef.$asArray();
      messages.$loaded().then(function (messages) {
        $scope.messages = messages;
      });
    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);
      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.loadNext = function (increment) {
      var priority = $scope.messages[0] ? $scope.messages[0].$priority : moment().unix();

      query({orderByPriority: true, limitToLast: $scope.limit, endAt: priority - 1});
    };

    $scope.loadPrev = function (increment) {
      var priority = $scope.messages.length ? $scope.messages[$scope.messages.length - 1].$priority : 0;

      query({orderByPriority: true, limitToLast: $scope.limit, startAt: priority + 1});
    };

    $scope.search = function (term) {
      $scope.searching = true;
      query({orderByChild: 'userEmail', equalTo: term});
    };

    $scope.setSearch = function (term) {
      $scope.searchTerm = term;
    $scope.search(term);
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };

    messages.$loaded().then(function () {
      if ($stateParams.search) {
        var term = $stateParams.search;
        $scope.searchTerm = term;
        $scope.search(term);
      }
    });
    
  });
