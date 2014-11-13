'use strict';

angular.module('quiverCmsApp')
  .service('AdminService', function AdminService($firebase, env, Restangular) {
    var firebaseEndpoint = env.firebase.endpoint;

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

      getProducts: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/content/products'));
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

      getDiscounts: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/discounts'));
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

      getUsers: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/users'));
      },

      getUser: function (key) {
        return $firebase(new Firebase(firebaseEndpoint + '/users/' + key));
      },

      getTransactions: function () {
        return $firebase(new Firebase(firebaseEndpoint + '/logs/transactions'));
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
      }

    }
  });
