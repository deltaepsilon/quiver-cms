'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.userService
 * @description
 * # userService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('UserService', function ($firebase, env, Restangular) {
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
      }

    };
    
  });
