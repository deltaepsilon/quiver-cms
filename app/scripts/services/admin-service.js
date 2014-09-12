'use strict';

angular.module('quiverCmsApp')
  .service('AdminService', function AdminService($firebase, env) {
    var firebaseEndpoint = env.firebase;

    return {
      getWords: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/content/words'));
      },

      getWord: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/words/' + key));
      },

      getDrafts: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/words/' + key + '/drafts'));
      },

      getFiles: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/content/files'));
      },

      getFile: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/files/' + key));
      },

      getNotifications: function (userId) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + userId + '/notifications'));
      }
    }
  });
