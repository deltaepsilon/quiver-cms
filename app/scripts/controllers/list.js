'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ListCtrl
 * @description
 * # ListCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ListCtrl', function ($scope, $q, limit, ref, getRef, moment, $stateParams) {
    /*
     * Items
     */
    var items = ref.$asArray();
    $scope.items = items;
    // items.$loaded().then(function (items) {
    //   console.log('items', items);
    // });

    // items.$loaded().then(function (items) {
    //   var i = items.length;

    //   while (i--) {
    //     items[i].$priority = moment(items[i].created).unix();
    //     // items[i].$priority = i + 1;
    //     items.$save(items[i]);
    //   }

    // });

    /*
     * Query
     */
    var query = function (q) {
      var deferred = $q.defer(),
        isPaginating = !!q,
        q = q || {orderByPriority: true, limitToLast: $scope.limit};
      
      $scope.disableMore = false;
      $scope.disableReset = false;
      $scope.disablePrev = false;
      $scope.disableNext = false;

      if (q.orderByChild) {
        delete q.orderByPriority;
      }

      ref = getRef(q);
      items = ref.$asArray();
      items.$loaded().then(function (items) {
        var i = Math.max($scope.limit - items.length, 0),
         priority = $scope.getNullPriority ? $scope.getNullPriority(items) : 0;

        if (i && q.endAt) {
          priority = 0;
          $scope.loadPrev(0).then(function (items) {
            $scope.disablePrev = true;
            deferred.resolve(items);
            
          });

        } else if (i && q.startAt && !q.noReset) {
          
          $scope.reset().then(function (items) {
            $scope.disableNext = true;
            deferred.resolve(items);

          });

        } else {
          if (i) {
            $scope.disableMore = true;
          }

          if ($scope.padList) {
            while (i--) {
              items.push({"$priority": priority});
            }
          }
          $scope.items = items;
          $scope.paginating = isPaginating;

          deferred.resolve(items);

        }
        

      });

      return deferred.promise;

    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);
      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.loadNext = function (priority, q) {

      if (typeof priority === 'undefined') {
        priority = $scope.items[0] ? $scope.items[0].$priority : moment().unix();
      }

      q = q || {};
      _.defaults(q, {orderByPriority: true, limitToLast: $scope.limit, endAt: priority - 1});

      if (q.limitToFirst) { // Can't have both
        delete q.limitToLast;
      }

      if (q.startAt || q.endAt === false) { // Can't have both
        delete q.endAt;
      }

      return query(q);
    };

    $scope.loadPrev = function (priority, q) {
      if (typeof priority === 'undefined') {
        priority = $scope.items.length ? $scope.items[$scope.items.length - 1].$priority : 0;
      }

      q = q || {};
      _.defaults(q, {orderByPriority: true, limitToLast: $scope.limit, startAt: priority + 1});

      if (q.limitToFirst) { // Can't have both
        delete q.limitToLast;
      }

      if (q.endAt || q.startAt === false) { // Can't have both
        delete q.startAt;
      }

      return query(q);
    };

    $scope.search = function (q) {
      query(_.defaults(q, {limitToLast: $scope.limit, noReset: true}));
    };

    $scope.reset = function (q) {
      $scope.limit = limit;
      return query(q).then(function (items) {
        var deferred = $q.defer();

        $scope.disableReset = true;

        deferred.resolve(items);

        return deferred.promise;
      });    

      return promise;
    };

    $scope.saveItem = function (item) {
      return $scope.items.$save(item);
    };

    $scope.removeItem = function (item) {
      return $scope.items.$remove(item);
    };

    items.$loaded().then(function () {
      if ($stateParams.search) {
        var term = $stateParams.search,
          q = {startAt: term};
        $scope.searchTerm = term;

        if ($scope.searchField) {
          q.orderByChild = $scope.searchField;
        } else {
          q.orderByPriority = true;
        }

        $scope.search(q);
      }
    });
    
  });
