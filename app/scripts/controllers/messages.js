'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:MessagesCtrl
 * @description
 * # MessagesCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('MessagesCtrl', function ($scope, $q, messageableRef, sentMessagesRef, receivedMessagesRef, UserService, NotificationService, _) {

    /*
     * Users
     */
    $scope.users = messageableRef.$asArray();
 
    $scope.addUser = function (user) {
      if (user && !_.findWhere($scope.uniqueUsers, {id: user.userKey})) {
        $scope.uniqueUsers = getUniqueUsers($scope.sentMessages.concat($scope.receivedMessages)).concat({
          id: user.userKey,
          name: user.userName || user.email,
          email: user.email
        });  

      }

      $scope.newRecipients = getNewRecipients();

      var i = $scope.uniqueUsers.length;

      while (i--) {
        if ($scope.uniqueUsers[i].id === user.userKey) {
          return $scope.selectUser($scope.uniqueUsers[i]);
        }
      }

      

    };

    /*
     * Messages
     */
    $scope.sentMessages = sentMessagesRef.$asArray();
    $scope.receivedMessages = receivedMessagesRef.$asArray();

    

    var getUniqueUsers = function (messages) {
      var users = {},
        i = messages.length,
        message;

      while (i--) {
        message = messages[i];

        users[message.recipientId] = {
          id: message.recipientId,
          name: message.recipientName,
          email: message.recipientEmail
        };

        users[message.senderId] = {
          id: message.senderId,
          name: message.senderName,
          email: message.senderEmail
        };

      }

      if (users[$scope.user.public.id]) {
        delete users[$scope.user.public.id];
      }

      return _.toArray(users);


    };

    $scope.selectUser = function (user) {
      if ($scope.selectedUser) {
        delete $scope.selectedUser.active;
      }

      $scope.selectedUser = user;
      $scope.selectedUser.active = true;
    };

    /*
     * Populate the user lists
     */

    var getNewRecipients = function () {
      var uniqueUserIds = _.pluck($scope.uniqueUsers, 'id');

      return _.filter($scope.users, function (user) {
        return $scope.user.$id !== user.userKey && !~uniqueUserIds.indexOf(user.userKey);
      });
    };

    $q.all([$scope.users.$loaded(), $scope.sentMessages.$loaded(), $scope.receivedMessages.$loaded()]).then(function () {
      $scope.loaded = true;

      $scope.uniqueUsers = getUniqueUsers($scope.sentMessages.concat($scope.receivedMessages));
      if ($scope.uniqueUsers.length) {
        $scope.selectUser($scope.uniqueUsers[0]);
      }

      $scope.newRecipients = getNewRecipients();

      
    });

    $scope.getMessages = function (userId) {
      var sent = _.where($scope.sentMessages, {recipientId: userId}),
        received = _.where($scope.receivedMessages, {senderId: userId}),
        combined = sent.concat(received),
        sorted = _.sortBy(combined, function (message) {
          return message.$priority;
        });

      return sorted;
    };

    $scope.sendMessage = function (userId, recipientId, message) {
      UserService.sendMessage(userId, recipientId, message).then(function () {
        // NotificationService.success('Message sent');
      }, function (err) {
        NotificationService.error('Message failed', err);
      });
    };

    $scope.markAsRead = function (message) {
      console.log('markAsRead not implemented', message);
    };


  });
