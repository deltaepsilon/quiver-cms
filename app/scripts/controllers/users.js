'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UsersCtrl', function ($scope, usersRef, limit, AdminService) {
    /*
     * Users
     */
    var users = usersRef.$asArray();
    $scope.users = users;

    /*
     * Limit
     */
    $scope.limit = limit;

    $scope.loadMore = function() {
      $scope.limit += limit;

      usersRef = AdminService.getUsers({orderByPriority: true, limitToLast: $scope.limit});
      usersRef.$asArray().$loaded(function(users) {
        $scope.users = users;
      });
    };

    /*
     * Query
     */
    var query = function (q) {
      var q = q || {orderByPriority: true, limitToLast: $scope.limit};

      usersRef = AdminService.getUsers(q);
      users = usersRef.$asArray();
      users.$loaded().then(function (users) {
        $scope.users = users;
      });
    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);

      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.search = function (term) {
      $scope.searching = true;
      query({orderByPriority: true, orderByChild: 'email', startAt: term});
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };
    
  });
