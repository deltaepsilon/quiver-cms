var ConfigService = require('./config-service'),
    Firebase = require('firebase'),
    firebaseEndpoint = ConfigService.get('public.firebase.endpoint'),
    firebaseRoot = new Firebase(firebaseEndpoint),
    firebaseSecret = ConfigService.get('private.firebase.secret'),
    Utility = require('../extensions/utility'),
    Q = require('q'),
    authWithSecret = function(ref, persist) {
        var deferred = Q.defer();

        ref.authWithCustomToken(firebaseSecret, function() {
            deferred.resolve(ref);

            if (persist) {
                firebaseRoot.onAuth(function(authData) {
                    if (!authData) {
                        ref.authWithCustomToken(firebaseSecret, function(authData) {
                            // console.log('logged back in', authData);
                        });
                    } else {
                        // console.log('auth successful.');
                    }

                });

            }


        });

        return deferred.promise;
    },
    promise = authWithSecret(firebaseRoot, true);

module.exports = {
    firebaseRoot: firebaseRoot,

    authWithSecret: authWithSecret,

    isAuthenticated: function() {
        return promise;
    },

    getValue: function(ref, cb) {
        var deferred = Utility.async(cb);

        ref.once('value', function(snap) {
            deferred.resolve(snap.val());
        });

        return deferred.promise
    },

    getWords: function() {
        return firebaseRoot.child('content').child('words');
    },

    getProducts: function() {
        return firebaseRoot.child('content').child('products');
    },

    getInstagram: function() {
        return firebaseRoot.child('content').child('social').child('instagram');
    },

    getFiles: function() {
        return firebaseRoot.child('content').child('files');
    },

    getHashtags: function() {
        return firebaseRoot.child('content').child('hashtags');
    },

    getUsers: function() {
        return firebaseRoot.child('users');
    },

    getUser: function(key) {
        return firebaseRoot.child('users').child(key);
    },

    getUsersByEmail: function(email) {
        return firebaseRoot.child('users').orderByChild('email').equalTo(email);
    },

    getAcl: function(key) {
        return firebaseRoot.child('acl').child(key);
    },

    getDiscounts: function() {
        return firebaseRoot.child('discounts');
    },

    getSettings: function() {
        return firebaseRoot.child('settings');
    },

    getTransaction: function(key) {
        return firebaseRoot.child('logs').child('transactions').child(key);
    },

    getTheme: function() {
        return firebaseRoot.child('theme');
    },

    getLogs: function() {
        return firebaseRoot.child('logs');
    },

    getResources: function() {
        return firebaseRoot.child('resources');
    },

    getResource: function(key) {
        return firebaseRoot.child('resources').child(key);
    },

    getMessages: function() {
        return firebaseRoot.child('logs').child('messages');
    },

    getUploads: function() {
        return firebaseRoot.child('logs').child('uploads');
    },

    getEmailQueue: function() {
        return firebaseRoot.child('queues').child('email');
    },

    getQueuedEmail: function(emailKey) {
        return firebaseRoot.child('queues').child('email').child(emailKey);
    },

    getShipment: function(key) {
        return firebaseRoot.child('logs').child('shipments').child(key);
    },

    getAssignments: function() {
        return firebaseRoot.child('content').child('assignments');
    },

    getAssignment: function(key) {
        return firebaseRoot.child('content').child('assignments').child(key);
    },

    getReports: function() {
        return firebaseRoot.child('admin').child('reports');
    },

    getBackups: function() {
        return firebaseRoot.child('admin').child('backups');
    },

    getLandingPages: function() {
        return firebaseRoot.child('admin').child('landingPages');
    },

    /*
     * User Objects
     */
    getUserTransactions: function(userId) {
        return firebaseRoot.child('userObjects').child('transactions').child(userId);
    },

    getUserTransaction: function(userId, key) {
        return firebaseRoot.child('userObjects').child('transactions').child(userId).child(key);
    },

    getUserSubscriptions: function(userId, key) {
        return firebaseRoot.child('userObjects').child('subscriptions').child(userId);
    },

    getUserSubscription: function(userId, key) {
        return firebaseRoot.child('userObjects').child('subscriptions').child(userId).child(key);
    },

    getUserGifts: function(userId) {
        return firebaseRoot.child('userObjects').child('gifts').child(userId);
    },

    getUserShipments: function(userId) {
        return firebaseRoot.child('userObjects').child('shipments').child(userId);
    },

    getUserDownloads: function(userId) {
        return firebaseRoot.child('userObjects').child('downloads').child(userId);
    },

    getUserAssignment: function(userId, assignmentKey) {
        return firebaseRoot.child('userObjects').child('assignments').child(userId).child('submitted').child(assignmentKey);
    },

    getUserAssignmentMessages: function(userId, assignmentKey) {
        return firebaseRoot.child('userObjects').child('assignments').child(userId).child('submitted').child(assignmentKey).child('messages');
    },

    getUserAssignmentUploads: function(userId, assignmentKey) {
        return firebaseRoot.child('userObjects').child('assignments').child(userId).child('submitted').child(assignmentKey).child('uploads');
    },

    getUserMessages: function(userId) {
        return firebaseRoot.child('userObjects').child('messages').child(userId);
    },

    getUserFiles: function(userId) {
        return firebaseRoot.child('userObjects').child('files').child(userId);
    },

    /*
     * Moderator
     */
    getModeratorMessages: function(assignmentId) {
        return firebaseRoot.child('moderator').child('messages').child(assignmentId);
    },

    getModeratorUploads: function(assignmentId) {
        return firebaseRoot.child('moderator').child('uploads').child(assignmentId);
    }

}