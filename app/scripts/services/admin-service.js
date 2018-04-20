'use strict';

angular.module('quiverCmsApp')
    .service('AdminService', function AdminService($firebaseObject, $firebaseArray, env, Restangular, FirebaseService, $localStorage, $state, moment) {
        var firebaseEndpoint = env.firebase.endpoint,
            toLanding = function() {
                location.replace('/');
            };

        return {
            toLanding: toLanding,

            loggedOutStates: ['master.nav.login', 'master.nav.register', 'master.nav.reset'],

            redirect: function() {
                if ($localStorage.redirect) {
                    if (typeof $localStorage.redirect === 'object' && $localStorage.redirect.toState && $localStorage.redirect.toState.name !== 'master.nav.login') {
                        $state.go($localStorage.redirect.toState.name, $localStorage.redirect.toParams);
                    } else if (typeof $localStorage.redirect === 'string') {
                        var redirect = $localStorage.redirect;
                        delete $localStorage.redirect;
                        location.replace(redirect);
                    } else {
                        toLanding();
                    }


                } else {
                    toLanding();
                }
            },

            getWords: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/content/words'), query);
            },

            getWord: function(key) {
                var cachedDate = moment(),
                    cached = false,
                    cache = function(dateString) {
                        var current = moment(dateString);

                        cachedDate.millisecond(current.millisecond());
                        cachedDate.seconds(current.seconds());
                        cachedDate.minute(current.minute());
                        cachedDate.hour(current.hour());
                        cachedDate.year(current.year());
                        cachedDate.dayOfYear(current.dayOfYear());
                        cached = true;

                    },
                    Word = $firebaseObject.$extend({
                        getSetPublishedDate: function(date) {
                            if (!date) {
                                if (!this.published || !this.published.published) {
                                    return undefined;
                                } else if (!cached) {
                                    cache(this.published.published);
                                }

                            } else {
                                if (!this.published) {
                                    this.published = {};
                                }
                                this.published.published = moment(date).format();
                                cache(this.published.published);

                            }

                            return cachedDate.toDate();

                        }
                    });

                return new Word(firebase.database().ref(firebaseEndpoint + '/content/words/' + key));
            },

            getWordHashtags: function(key) {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/words/' + key + '/hashtags'));
            },

            getDrafts: function(key) {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/words/' + key + '/drafts'));
            },

            getFiles: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/content/files'));
            },

            getFile: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/content/files/Originals/' + key));
            },

            getOriginals: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/content/files/Originals'), query);
            },

            getBucket: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/content/files/Name')).$loaded();
            },

            getNotifications: function(userId) {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/users/' + userId + '/notifications'));
            },

            getHashtags: function() {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/hashtags'));
            },

            getSocial: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/content/social'));
            },

            getInstagramTerms: function() {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/social/instagram/terms'));
            },

            updateInstagram: function() {
                return Restangular.one('admin').one('instagram').get();
            },

            getInstagramResults: function(term) {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/social/instagram/results/' + term + '/data'));
            },

            getTheme: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/theme'));
            },

            getSettings: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/settings'));
            },

            getReload: function () {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/settings/reload'));  
            },

            getAdminSettings: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/admin/settings'));
            },

            clearCache: function() {
                return Restangular.one('admin').one('clear-cache').get();
            },

            getApiUser: function(headers) {
                return Restangular.one('user').one(headers.uid).one('provider').one(headers.provider).get({}, headers);
            },

            getProducts: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/content/products'), query);
            },

            getAllProducts: function() {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/products'));
            },

            getProduct: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/content/products/' + key));
            },

            getProductHashtags: function(key) {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/products/' + key + '/hashtags'));
            },

            getProductImages: function(key) {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/products/' + key + '/images'));
            },

            getProductOptionGroups: function(key) {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/products/' + key + '/optionGroups'));
            },

            getProductOptionsMatrix: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/content/products/' + key + '/optionsMatrix'));
            },

            getDiscounts: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/discounts'), query);
            },

            getServerDiscounts: function() {
                return Restangular.one('admin').one('discounts').get();
            },

            getCommerce: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/commerce'));
            },

            getCountries: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/commerce/countries'));
            },

            getStates: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/commerce/states'));
            },

            getShipping: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/commerce/shipping'));
            },

            getUsers: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/users'), query);
            },

            getUser: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/users/' + key));
            },

            getTransactions: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/logs/transactions'), query);
            },

            getTransaction: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/logs/transactions/' + key));
            },

            sendTransactionEmail: function(key, transaction) {
                return Restangular.one('admin').one('transaction').one(key).post('email', transaction);
            },

            chargeCard: function(transaction, key) {
                return Restangular.one('admin').one('transaction').one(key || transaction.$id).post('charge', transaction);
            },

            setUserEmail: function(uid, email) {
                var emailObj = $firebaseObject(firebase.database().ref(firebaseEndpoint + '/users/' + uid + '/public/email'));
                emailObj = email;
                return emailObj.$save();
            },

            getAssignments: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/content/assignments'), query);
            },

            getAllAssignments: function() {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/content/assignments'));
            },

            getAssignment: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/content/assignments/' + key));
            },

            getSubscriptions: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/logs/subscriptions'), query);
            },

            getSubscription: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/logs/subscriptions/' + key));
            },

            getShipments: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/logs/shipments'), query);
            },

            getShipment: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/logs/shipments/' + key));
            },

            getMessages: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/logs/messages'), query);
            },

            getUploads: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/logs/uploads'), query);
            },

            getUpload: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/logs/uploads/' + key));
            },

            queueFeedbackEmail: function(userId, assignmentKey) {
                return Restangular.one('admin').one('user').one(userId).one('assignment').one(assignmentKey).post('queue-feedback-email');
            },

            getEmailQueue: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/queues/email'), query);
            },

            sendQueuedEmail: function(email) {
                return Restangular.one('admin').one('email').one(email.$id).post('send', email);
            },

            sendQueuedFeedback: function(email) {
                return Restangular.one('admin').one('email').one('send').post('feedback');
            },

            getResources: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/resources'), query);
            },

            getResource: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/resources/' + key));
            },

            getSurveys: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/settings/surveys'), query);
            },

            getSurvey: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/settings/surveys/' + key));
            },

            getSurveyAnswers: function(key, query) {
                return $firebaseArray(FirebaseService.query(firebase.database().ref(firebaseEndpoint + '/settings/surveys/' + key + '/answers'), query));
            },

            getMessageable: function(query) {
                return $firebaseArray(FirebaseService.query(firebase.database().ref(firebaseEndpoint + '/messageable'), query));
            },

            incrementMessageFlag: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/logs/messages/' + key)).$loaded().then(function(message) {
                    message.flag = (message.flag || 0) + 1
                    if (message.flag > 3) {
                        message.flag = 0;
                    }
                    return message.$save();
                });
            },

            incrementUploadFlag: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/logs/uploads/' + key)).$loaded().then(function(upload) {
                    upload.flag = (upload.flag || 0) + 1
                    if (upload.flag > 3) {
                        upload.flag = 0;
                    }
                    return upload.$save();
                });
            },

            runReports: function() {
                return Restangular.one('admin').one('report').post('run');
            },

            getReports: function() {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/admin/reports'));
            },

            runBackup: function() {
                return Restangular.one('admin').one('backup').post('run');
            },

            updateBackups: function() {
                return Restangular.one('admin').one('backup').post('update');
            },

            getBackups: function() {
                return $firebaseArray(firebase.database().ref(firebaseEndpoint + '/admin/backups/Contents'));
            },

            getLandingPage: function(key) {
                return $firebaseObject(firebase.database().ref(firebaseEndpoint + '/admin/landingPages/' + key));
            },

            getLandingPages: function(query) {
                return FirebaseService.paginatingArray(firebase.database().ref(firebaseEndpoint + '/admin/landingPages'), query);
            },

            saveLandingPage: function(slug) {
                return Restangular.one('admin').one('template').one('reset-page').post(slug);
            },

            getLogs: function (type) {
                return Restangular.one('admin').one('logs').getList(type);
            },

            clearLogs: function (type) {
                return Restangular.one('admin').one('logs').one(type).remove();  
            },

            getTest: function (type) {
                return Restangular.one('admin').one('test').post(type);
            },

            breakDiscountsCache: function () {
                return Restangular.one('admin').one('discounts').post('breakCache');  
            }

        }
    });