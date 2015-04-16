'use strict';

angular.module('quiverCmsApp')
  .service('AdminService', function AdminService($firebaseObject, $firebaseArray, env, Restangular, FirebaseService, $localStorage, $state, moment) {
    var firebaseEndpoint = env.firebase.endpoint,
      toLanding = function () {
        location.replace('/');        
      };

    return {
      toLanding: toLanding,

      loggedOutStates: ['master.nav.login', 'master.nav.register', 'master.nav.reset'],

      redirect: function () {
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

      getWords: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/words'), query));
      },

      getWord: function (key) {
        var cachedDate = moment(),
          cached = false,
          cache = function (dateString) {
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
            getSetPublishedDate: function (date) {
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

        return new Word(new Firebase(firebaseEndpoint + '/content/words/' + key));
      },

      getWordHashtags: function (key) {
        return $firebaseArray(new Firebase(firebaseEndpoint + '/content/words/' + key + '/hashtags'));
      },

      getDrafts: function (key) {
        return $firebaseArray(new Firebase(firebaseEndpoint + '/content/words/' + key + '/drafts'));
      },

      getFiles: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/content/files'));
      },

      getFile: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/content/files/Originals/' + key));
      },

      getOriginals: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/files/Originals'), query));
      },

      getBucket: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/content/files/Name')).$loaded();
      },

      getNotifications: function (userId) {
        return $firebaseArray(new Firebase(firebaseEndpoint + '/users/' + userId + '/notifications'));
      },

      getHashtags: function () {
        return $firebaseArray(new Firebase(firebaseEndpoint + '/content/hashtags'));
      },

      getSocial: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/content/social'));
      },

      getInstagramTerms: function () {
        return $firebaseArray(new Firebase(firebaseEndpoint + '/content/social/instagram/terms'));
      },

      updateInstagram: function () {
        return Restangular.one('admin').one('instagram').get();
      },

      getTheme: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/theme'));
      },

      getSettings: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/settings'));
      },

      getAdminSettings: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/admin/settings'));
      },

      clearCache: function () {
        return Restangular.one('admin').one('clear-cache').get();
      },

      getApiUser: function (headers) {
        return Restangular.one('user').one(headers.uid).one('provider').one(headers.provider).get({}, headers);
      },

      getProducts: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/products'), query));
      },

      getProduct: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/content/products/' + key));
      },

      getProductImages: function (key) {
        return $firebaseArray(new Firebase(firebaseEndpoint + '/content/products/' + key + '/images'));
      },

      getProductOptionGroups: function (key) {
        return $firebaseArray(new Firebase(firebaseEndpoint + '/content/products/' + key + '/optionGroups'));
      },

      getProductOptionsMatrix: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/content/products/' + key + '/optionsMatrix'));
      },

      getDiscounts: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/discounts'), query));
      },

      getServerDiscounts: function () {
        return Restangular.one('admin').one('discounts').get();
      },

      getCommerce: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/commerce'));
      },

      getCountries: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/commerce/countries'));
      },

      getStates: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/commerce/states'));
      },

      getShipping: function () {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/commerce/shipping'));
      },

      getUsers: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/users'), query));
      },

      getUser: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/users/' + key));
      },

      getTransactions: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/logs/transactions'), query));
      },

      getTransaction: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/logs/transactions/' + key));
      },

      sendTransactionEmail: function (key, transaction) {
        return Restangular.one('admin').one('transaction').one(key).post('email', transaction);
      },

      chargeCard: function (transaction, key) {
        return Restangular.one('admin').one('transaction').one(key || transaction.$id).post('charge', transaction);
      },

      setUserEmail: function (uid, email) {
        var emailObj = $firebaseObject(new Firebase(firebaseEndpoint + '/users/' + uid + '/public/email'));
        emailObj = email;
        return emailObj.$save();
      },

      getAssignments: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/assignments'), query));
      },

      getAssignment: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/content/assignments/' + key));
      },

      getSubscriptions: function(query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/logs/subscriptions'), query));
      },

      getSubscription: function(key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/logs/subscriptions/' + key));
      },

      getShipments: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/logs/shipments'), query));
      },

      getShipment: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/logs/shipments/' + key));
      },

      getMessages: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/logs/messages'), query));
      },

      getUploads: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/logs/uploads'), query));
      },

      getUpload: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/logs/uploads/' + key));
      },

      queueFeedbackEmail: function (userId, assignmentKey) {
        return Restangular.one('admin').one('user').one(userId).one('assignment').one(assignmentKey).post('queue-feedback-email');
      },

      getEmailQueue: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/queues/email'), query));
      },

      sendQueuedEmail: function (email) {
        return Restangular.one('admin').one('email').one(email.$id).post('send', email);
      },

      sendQueuedFeedback: function (email) {
        return Restangular.one('admin').one('email').one('send').post('feedback');
      },

      getResources: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/resources'), query));
      },

      getResource: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/resources/' + key));
      },

      getSurveys: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/settings/surveys'), query));
      },

      getSurvey: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/settings/surveys/' + key));
      },

      getSurveyAnswers: function (key, query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/settings/surveys/' + key + '/answers'), query));
      },

      getMessageable: function (query) {
        return $firebaseArray(FirebaseService.query(new Firebase(firebaseEndpoint + '/messageable'), query));
      },

      incrementMessageFlag: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/logs/messages/' + key)).$loaded().then(function (message) {
          message.flag = (message.flag || 0) + 1
          if (message.flag > 3) {
            message.flag = 0;
          }
          return message.$save();
        });
      },

      incrementUploadFlag: function (key) {
        return $firebaseObject(new Firebase(firebaseEndpoint + '/logs/uploads/' + key)).$loaded().then(function (upload) {
          upload.flag = (upload.flag || 0) + 1
          if (upload.flag > 3) {
            upload.flag = 0;
          }
          return upload.$save();
        });
      }

    }
  });
