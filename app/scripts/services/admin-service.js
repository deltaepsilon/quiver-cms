'use strict';

angular.module('quiverCmsApp')
  .service('AdminService', function AdminService($firebase, env, Restangular, FirebaseService) {
    var firebaseEndpoint = env.firebase.endpoint;

    return {
      getWords: function (query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/words'), query));
      },

      getWord: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/words/' + key));
      },

      getDrafts: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/words/' + key + '/drafts'));
      },

      getFiles: function (query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/files'), query));
      },

      getFile: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/files/' + key));
      },

      getNotifications: function (userId) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + userId + '/notifications'));
      },

      getHashtags: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/content/hashtags'));
      },

      getSocial: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/content/social'));
      },

      getInstagramTerms: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/content/social/instagram/terms'));
      },

      updateInstagram: function () {
        return Restangular.one('admin').one('instagram').get();
      },

      getTheme: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/theme'));
      },

      getSettings: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/settings'));
      },

      clearCache: function () {
        return Restangular.one('admin').one('clear-cache').get();
      },

      getApiUser: function (id, headers) {
        return Restangular.one('user').one(id).get({}, headers);
      },

      getProducts: function (query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/products'), query));
      },

      getProduct: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/products/' + key));
      },

      getProductImages: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/products/' + key + '/images'));
      },

      getProductOptionGroups: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/products/' + key + '/optionGroups'));
      },

      getProductOptionsMatrix: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/products/' + key + '/optionsMatrix'));
      },

      getDiscounts: function (query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/discounts'), query));
      },

      getServerDiscounts: function () {
        return Restangular.one('admin').one('discounts').get();
      },

      getCommerce: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/commerce'));
      },

      getCountries: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/commerce/countries'));
      },

      getStates: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/commerce/states'));
      },

      getShipping: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/commerce/shipping'));
      },

      getUsers: function (query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/users'), query));
      },

      getUser: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + key));
      },

      getTransactions: function (query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/logs/transactions'), query));
      },

      getTransaction: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/logs/transactions/' + key));
      },

      getUserTransaction: function (userId, key) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + userId + '/private/commerce/transactions/' + key));
      },

      sendEmail: function (key, transaction) {
        return Restangular.one('admin').one('transaction').one(key).post('email', transaction);
      },

      chargeCard: function (key, transaction) {
        return Restangular.one('admin').one('transaction').one(key).post('charge', transaction);
      },

      setUserEmail: function (uid, email) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + uid + '/public/email')).$set(email);
      },

      getAssignments: function (query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/content/assignments'), query));
      },

      getAssignment: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/content/assignments/' + key));
      },

      getSubscriptions: function(query) {
        return $firebase(FirebaseService.query(new Firebase(firebaseEndpoint + '/logs/subscriptions'), query));
      },

      getSubscription: function(key) {
        return $firebase(new Firebase(firebaseEndpoint + '/logs/subscriptions/' + key));
      }

    }
  });
