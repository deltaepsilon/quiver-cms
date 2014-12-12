'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:FeedbackCtrl
 * @description
 * # FeedbackCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('FeedbackCtrl', function ($scope, clientRef, assignmentRef, userAssignmentRef, assignmentUploadsRef, assignmentMessagesRef, UserService) {
    /*
     * Client
     */
    $scope.client = clientRef.$asObject();
    
    /*
     * Assignment
     */
    $scope.assignment = assignmentRef.$asObject();

    /*
     * User Assignment
     */
    $scope.userAssignment = userAssignmentRef.$asObject();

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

  });
