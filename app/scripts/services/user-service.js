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
      getTransaction: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + userId + '/private/commerce/transactions/' + key));
      },

      getSubscription: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + userId + '/private/commerce/subscriptions/' + key));
      },

      getPages: function(userId, key) {
        return Restangular.one('user').one(userId).one('subscription').one(key).one('pages').get();
      },

      getAssignments: function (userId, key) {
        return Restangular.one('user').one(userId).one('subscription').one(key).one('assignments').get();
      },

      getMessages: function (userId, query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/users/' + userId + '/public/messages'), query));
      },

      logMessage: function (userId, assignmentKey, type, message) {
        return Restangular.one('user').one(userId).one('assignment').one(assignmentKey).one('log').post(type, message);
      },

      removeUpload: function (userId, file) {
        return Restangular.one('user').one(userId).one('upload').post('remove', file);
      }

    };
    
  });
