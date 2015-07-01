'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.ModeratorService
 * @description
 * # ModeratorService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
    .service('ModeratorService', function($firebaseObject, $firebaseArray, env, Restangular, FirebaseService, $localStorage, $state, moment) {
        var firebaseEndpoint = env.firebase.endpoint;

        return {
            getMessages: function(key, query) {
                return FirebaseService.paginatingArray(new Firebase(firebaseEndpoint + '/moderator/messages/' + key), query);
            },

            getUploads: function(key, query) {
                return FirebaseService.paginatingArray(new Firebase(firebaseEndpoint + '/moderator/uploads/' + key), query);
            },

            incrementMessageFlag: function(assignmentKey, messageKey) {
                return $firebaseObject(new Firebase(firebaseEndpoint + '/moderator/messages/' + assignmentKey + '/' + messageKey)).$loaded().then(function(message) {
                    message.flag = (message.flag || 0) + 1
                    if (message.flag > 3) {
                        message.flag = 0;
                    }
                    return message.$save();
                });
            },

            incrementUploadFlag: function(assignmentKey, messageKey) {
                return $firebaseObject(new Firebase(firebaseEndpoint + '/moderator/uploads/' + assignmentKey + '/' + messageKey)).$loaded().then(function(upload) {
                    upload.flag = (upload.flag || 0) + 1
                    if (upload.flag > 3) {
                        upload.flag = 0;
                    }
                    return upload.$save();
                });
            }
        };
    });