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
                    var logFlagRef = new Firebase(firebaseEndpoint + '/logs/' + type + '/' + entry.keys.log + '/flag'),
                        moderatorFlagRef = new Firebase(firebaseEndpoint + '/moderator/' + type + '/' + entry.assignmentKey + '/' + entry.keys.moderator + '/flag'),
                        incrementer = function(i) {
                            return i >= maxFlag ? 0 : (i || 0) + 1;
                        },
                        errorHandler = function(err) {
                            return err ? console.warn('incrementMessageFlag error', err) : false;
                        };

                    logFlagRef.transaction(incrementer, errorHandler);
                    moderatorFlagRef.transaction(incrementer, errorHandler);
                };
            };

        return {
            getMessages: function(key, query) {
                return FirebaseService.paginatingArray(new Firebase(firebaseEndpoint + '/moderator/messages/' + key), query);
            },

            getUploads: function(key, query) {
                return FirebaseService.paginatingArray(new Firebase(firebaseEndpoint + '/moderator/uploads/' + key), query);
            },

            incrementMessageFlag: getIncrementer('messages'),

            incrementUploadFlag: getIncrementer('uploads')
        };
    });