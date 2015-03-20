'use strict';

angular.module('quiverCmsApp')
  .controller('DashboardCtrl', function ($scope, limit, assignments, subscriptions, shipments, gifts, downloads, transactions, UserService, $stateParams, moment, _) {

    /*
     * Objects
     */
    $scope.subscriptions = subscriptions;
    $scope.shipments = shipments;
    $scope.gifts = gifts;
    $scope.downloads = downloads;
    $scope.transactions = transactions;

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
            flatMessages[j].title = assignments[i].title;
        }

        messages = messages.concat(flatMessages);

      }

      $scope.messages = _.sortBy(messages, function (message) {
        return-1 * (message.$priority || moment(message.created).unix());
      });  
    };

    $scope.assignments = assignments;

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
