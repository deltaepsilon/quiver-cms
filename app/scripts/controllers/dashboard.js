'use strict';

angular.module('quiverCmsApp')
  .controller('DashboardCtrl', function ($scope, limit, assignmentsRef, subscriptionsRef, shipmentsRef, giftsRef, downloadsRef, transactionsRef, UserService, $stateParams, moment, _) {

    /*
     * Objects
     */
    $scope.subscriptions = subscriptionsRef.$asArray();
    $scope.shipments = shipmentsRef.$asArray();
    $scope.gifts = giftsRef.$asArray();
    $scope.downloads = downloadsRef.$asArray();
    $scope.transactions = transactionsRef.$asArray();

    /*
     * Assignments
     */
    var populateMessages = function (assignments) {
      var i = assignments.length,
        messages = [],
        flatMessages,
        j;

      while (i--) {
        flatMessages = _.toArray(assignments[i].messages);
        j = flatMessages.length;

        while (j--) {
            flatMessages[j].subscriptionKey = assignments[i].subscriptionKey;            
            flatMessages[j].assignmentKey = assignments[i].assignmentKey;
        }

        messages = messages.concat(flatMessages);

      }

      $scope.messages = _.sortBy(messages, function (message) {
        return-1 * (message.$priority || moment(message.created).unix());
      });  
    };

    $scope.assignments = assignmentsRef.$asArray();

    $scope.assignments.$loaded().then(function (assignments) {
      populateMessages(assignments);
    });

    $scope.$watch('assignments', function () {
      populateMessages($scope.assignments);
    });

    /*
     * Subscription
     */
    $scope.isExpired = function (subscription) {
      return moment().unix() > moment(subscription.expiration).unix();
    }

  });
