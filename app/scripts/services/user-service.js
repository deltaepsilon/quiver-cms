'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.userService
 * @description
 * # userService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('UserService', function ($firebase, env) {
    var firebaseEndpoint = env.firebase.endpoint;

    return {
      getTransaction: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + userId + '/private/commerce/transactions/' + key));
      }

    };
    
  });
