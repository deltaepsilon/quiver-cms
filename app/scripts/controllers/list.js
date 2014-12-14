'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ListCtrl
 * @description
 * # ListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ListCtrl', function ($scope, limit, ref, getRef, moment) {
    /*
     * Items
     */
    var items = ref.$asArray();
    $scope.items = items;

    /*
     * Query
     */
    var query = function (q) {
      var isPaginating = !!q,
        q = q || {orderByPriority: true, limitToLast: $scope.limit};

      ref = getRef(q);
      items = ref.$asArray();
      items.$loaded().then(function (items) {
        var i = $scope.limit - items.length,
         priority;

        if (i && q.endAt) {
          priority = 0;
          $scope.disableNext = true;
          return $scope.loadPrev(0);
        } else if (i && q.startAt) {
          $scope.disablePrev = true;
          return $scope.reset();
        }

        while (i--) {
          items.push({"$priority": priority});
        }
        $scope.items = items;
        $scope.paginating = isPaginating;

      });

    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);
      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.loadNext = function (priority) {
      if (typeof priority === 'undefined') {
        priority = $scope.items[0] ? $scope.items[0].$priority : moment().unix();
      }

      $scope.disablePrev = false;
      query({orderByPriority: true, limitToLast: $scope.limit, endAt: priority - 1});
    };

    $scope.disablePrev = true;
    $scope.loadPrev = function (priority) {
      if (typeof priority === 'undefined') {
        priority = $scope.items.length ? $scope.items[$scope.items.length - 1].$priority : 0;
      }

      if (priority !== 0) {
        $scope.disableNext = false;
      }      
      query({orderByPriority: true, limitToLast: $scope.limit, startAt: priority + 1});
    };

    $scope.reset = function () {
      $scope.disableNext = false;
      $scope.disablePrev = true;
      $scope.limit = limit;
      query();
    };
    
  });
