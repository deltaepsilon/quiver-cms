'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.userService
 * @description
 * # userService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
    .service('UserService', function($firebaseObject, $firebaseArray, env, Restangular, FirebaseService, moment) {
        var firebaseEndpoint = env.firebase.endpoint;

        return {
            subscriptionIsExpired: function(subscription, save) {
                if (!subscription) {
                    return true;
                } else if (subscription.subscriptionType === 'content') {
                    if (!subscription.expiration && save && subscription.subscriptionDays) { // Save new expiration if asked to
                        subscription.expiration = moment().add(subscription.subscriptionDays, 'days').format();
                        subscription.$save();
                    } else if (moment().unix() > moment(subscription.expiration).unix()) {
                        return true;
                    }
                }

                return false;
            },

            getPublic: function(userId) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/users/' + userId + '/public')));
            },

            getPreferredEmail: function(userId) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/users/' + userId + '/preferredEmail')));
            },

            getName: function(userId) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/users/' + userId + '/name')));
            },

            getTransactions: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/transactions/' + userId), query)));
            },

            getTransaction: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/userObjects/transactions/' + userId + '/' + key)));
            },

            getSubscriptions: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/subscriptions/' + userId), query)));
            },

            getSubscription: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/userObjects/subscriptions/' + userId + '/' + key)));
            },

            getPages: function(userId, key) {
                return Restangular.one('user').one(userId).one('subscription').one(key).one('pages').getList();
            },

            getAssignments: function(userId, key) {
                return Restangular.one('user').one(userId).one('subscription').one(key).one('assignments').getList();
            },

            logMessage: function(userId, assignmentKey, type, message) {
                return Restangular.one('user').one(userId).one('assignment').one(assignmentKey).one('log').post(type, message);
            },

            removeUpload: function(userId, file) {
                return Restangular.one('user').one(userId).one('upload').post('remove', file);
            },

            getSentMessages: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/messages/' + userId + '/sent'), query)));
            },

            getSentMessage: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/userObjects/messages/' + userId + '/sent/' + key)));
            },

            getReceivedMessages: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/messages/' + userId + '/received'), query)));
            },

            getReceivedMessage: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/userObjects/messages/' + userId + '/received/' + key)));
            },

            sendMessage: function(userId, recipientId, text) {
                return FirebaseService.registerSecureRef(Restangular.one('user').one(userId).one('recipient').one(recipientId).post('send', {
                    text: text
                }));
            },

            getSubmittedAssignments: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/assignments/' + userId + '/submitted'), query)));
            },

            getAssignment: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/userObjects/assignments/' + userId + '/submitted/' + key)));
            },

            getAssignmentUploads: function(userId, key, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/assignments/' + userId + '/submitted/' + key + '/uploads'), query)));
            },

            getAssignmentMessages: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseArray(new Firebase(firebaseEndpoint + '/userObjects/assignments/' + userId + '/submitted/' + key + '/messages')));
            },

            getMessage: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/userObjects/messages/' + userId + '/' + key)));
            },

            getShipments: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/shipments/' + userId), query)));
            },

            getShipment: function(userId, key) {
                return FirebaseService.registerSecureRef($firebaseObject(new Firebase(firebaseEndpoint + '/userObjects/shipments/' + userId + '/' + key)));
            },

            getGifts: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/gifts/' + userId), query)));
            },

            getDownloads: function(userId, query) {
                return FirebaseService.registerSecureRef($firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/downloads/' + userId), query)));
            },

            getSurveyResponses: function(userId, query) {
                return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/userObjects/surveyResponses/' + userId), query));
            }

        };

    });