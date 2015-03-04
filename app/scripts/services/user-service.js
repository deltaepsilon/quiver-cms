'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.userService
 * @description
 * # userService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('UserService', function ($firebase, env, Restangular, FirebaseService) {
    var firebaseEndpoint = env.firebase.endpoint;

    return {
      getTransactions: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/transactions/' + userId), query));
      },

      getTransaction: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/transactions/' + userId + '/' + key));
      },

      getSubscriptions: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/subscriptions/' + userId), query));
      },

      getSubscription: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/subscriptions/' + userId + '/' + key));
      },

      getPages: function(userId, key) {
        return Restangular.one('user').one(userId).one('subscription').one(key).one('pages').get();
      },

      getAssignments: function (userId, key) {
        return Restangular.one('user').one(userId).one('subscription').one(key).one('assignments').get();
      },

      logMessage: function (userId, assignmentKey, type, message) {
        return Restangular.one('user').one(userId).one('assignment').one(assignmentKey).one('log').post(type, message);
      },

      removeUpload: function (userId, file) {
        return Restangular.one('user').one(userId).one('upload').post('remove', file);
      },

      getSentMessages: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/messages/' + userId + '/sent'), query));
      },

      getSentMessage: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/messages/' + userId + '/sent/' + key));
      },

      getReceivedMessages: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/messages/' + userId + '/received'), query));
      },

      getReceivedMessage: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/messages/' + userId + '/received/' + key));
      },

      sendMessage: function (userId, recipientId, text) {
        return Restangular.one('user').one(userId).one('recipient').one(recipientId).post('send', {text: text});
      },

      getSubmittedAssignments: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/assignments/' + userId + '/submitted'), query));
      },

      getAssignment: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/assignments/' + userId + '/submitted/' + key));
      },

      getAssignmentUploads: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/assignments/' + userId + '/submitted/' + key + '/uploads'));
      },

      getAssignmentMessages: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/assignments/' + userId + '/submitted/' + key + '/messages'));
      },

      getMessage: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/messages/' + userId + '/' + key));
      },

      getShipments: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/shipments/' + userId), query));
      },      

      getShipment: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/shipments/' + userId + '/' + key));
      },

      getGifts: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/gifts/' + userId), query));
      },
      
      getDownloads: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/downloads/' + userId), query));
      }
      
    };
    
  });
