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
        now = moment(),
        message = {
          userName: user.public.name || user.public.email || user.email,
          assignmentTitle: $scope.assignment.title,
          text: text,
          created: now.format(),
          $priority: now.unix(),
        };

      $scope.messages.$add(message).then(function (ref) {
        message.key = ref.key();
        message.isAdmin = true;
        message.recipientId = clientRef.$ref().key();

        UserService.logMessage(user.public.id, assignmentRef.$ref().key(), 'comment', message);
      });
    };

    /*
     * Uploads
     */
    $scope.uploads = assignmentUploadsRef.$asArray();

    // $scope.saveUpload = function (upload) {
    //   $scope.uploads.$save(upload);
    // };

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
