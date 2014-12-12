'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:FeedbackCtrl
 * @description
 * # FeedbackCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('FeedbackCtrl', function ($scope, clientRef, assignmentRef, userAssignmentRef, assignmentUploadsRef, assignmentMessagesRef, UserService, AdminService, NotificationService) {
    /*
     * Client
     */
    var client = clientRef.$asObject();
    client.$bindTo($scope, 'client');
    
    /*
     * Assignment
     */
    $scope.assignment = assignmentRef.$asObject();

    /*
     * User Assignment
     */
    var userAssignment = userAssignmentRef.$asObject();
    userAssignment.$bindTo($scope, 'userAssignment');

    /*
     * Messages
     */
    $scope.messages = assignmentMessagesRef.$asArray();

    $scope.sendMessage = function (text) {
      var user = $scope.user,
        now = moment().format();

      $scope.messages.$add({
        user: {
          name: user.public.name || user.public.email || user.email
        },
        text: text,
        created: now
      }).then(function (ref) {
        UserService.logMessage(user.public.id, assignmentRef.$ref().key(), 'comment', {
          key: ref.key(),
          text: text,
          recipientId: clientRef.$ref().key(),
          subscriptionKey: $scope.userAssignment.subscriptionKey,
          isAdmin: true
        });
      });
    };

    /*
     * Uploads
     */
    $scope.uploads = assignmentUploadsRef.$asArray();

    /*
     * Email Alerts
     */
    $scope.queueFeedbackEmail = function (clientId, userAssignmentKey) {
      AdminService.queueFeedbackEmail(clientId, userAssignmentKey).then(function () {
        NotificationService.success('Email Queued.');
      }, function (err) {
        NotificationService.error('Email Queue Failed', err);
      });
    };

  });
