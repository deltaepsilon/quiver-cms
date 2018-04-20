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
        var firebaseEndpoint = env.firebase.endpoint,
            maxFlag = 3,
            getIncrementer = function(type) {
                return function(entry) {
                    var incrementer = function(i) {
                            return i >= maxFlag ? 0 : (i || 0) + 1;
                        },
                        errorHandler = function(err) {
                            return err ? console.warn('incrementMessageFlag error', err) : false;
                        };

                    if (entry.keys && entry.keys.log) {
                        (firebase.database().ref(firebaseEndpoint + '/logs/' + type + '/' + entry.keys.log + '/flag')).transaction(incrementer, errorHandler);
                    }

                    if (entry.keys && entry.keys.moderator) {
                        (firebase.database().ref(firebaseEndpoint + '/moderator/' + type + '/' + entry.assignmentKey + '/' + entry.keys.moderator + '/flag')).transaction(incrementer, errorHandler);
                    }

                };
            };

        return {
            getMessages: function(key, query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/moderator/messages/' + key), query);
            },

            getUploads: function(key, query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/moderator/uploads/' + key), query);
            },

            incrementMessageFlag: getIncrementer('messages'),

            incrementUploadFlag: getIncrementer('uploads')
        };
    });