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
          flatMessages[j].moment = moment(flatMessages[j].created);
          flatMessages[j].unix = flatMessages[j].moment.unix();
          flatMessages[j].dateAndAssignment = flatMessages[j].moment.format("MM/DD/YYYY") + ": " + flatMessages[j].title;

        }

        messages = messages.concat(flatMessages);

      }

      $scope.groupedMessages = _.groupBy(messages, "dateAndAssignment");

      // var sortedMessages = _.sortBy(messages, function (message) {
      //   return -1 * (message.$priority || moment(message.created).unix());
      // });

      // var laggedDay,
      //   laggedYear,
      //   todaysMessages,
      //   groupedMessages;
      // _.each(sortedMessages, function (message) {
      //   if (message.dayOfYear !== laggedDay && message.year !== laggedYear) {
      //     todaysMessages = 
      //     laggedDay = message.dayOfYear;
      //     laggedYear = message.year;
      //     message.firstOfDay = true;
      //   }
      // });

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
