'use strict';

angular.module('quiverCmsApp')
  .controller('DashboardCtrl', function ($scope, limit, messagesRef, AdminService, $stateParams, moment, _) {
    /*
     * Messages
     */
    var messages = messagesRef.$asArray();
    $scope.messages = messages;

    /*
     * Query
     */
    var query = function (q) {
      var isPaginating = !!q,
        q = q || {orderByPriority: true, limitToLast: $scope.limit};

      messagesRef = AdminService.getUserMessages($scope.user.$id, q);
      messages = messagesRef.$asArray();
      messages.$loaded().then(function (messages) {
        var i = $scope.limit - messages.length,
         priority;

        if (i && q.endAt) {
          priority = 0;
          messages.endAt = true;
          $scope.disableNext = true;
          return $scope.loadPrev(0);
        } else if (i && q.startAt) {
          $scope.disablePrev = true;
          return $scope.reset();
        }

        while (i--) {
          messages.push({"$priority": priority});
        }
        $scope.messages = messages;
        $scope.paginating = isPaginating;

        // Force priorities
        // _.each(messages, function (message) {
        //   console.log('message', message);
        //   AdminService.getUserMessage($scope.user.$id, message.$id).$ref().setPriority(message.unix);
        // });
      });

    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);
      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.loadNext = function (priority) {
      if (typeof priority === 'undefined') {
        priority = $scope.messages[0] ? $scope.messages[0].$priority : moment().unix();
      }

      $scope.disablePrev = false;
      query({orderByPriority: true, limitToLast: $scope.limit, endAt: priority - 1});
    };

    $scope.disablePrev = true;
    $scope.loadPrev = function (priority) {
      if (typeof priority === 'undefined') {
        priority = $scope.messages.length ? $scope.messages[$scope.messages.length - 1].$priority : 0;
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

    /*
     * Subscription
     */
    $scope.isExpired = function (subscription) {
      return moment().unix() > moment(subscription.expiration).unix();
    }

  });
