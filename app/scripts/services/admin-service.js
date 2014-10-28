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

      getUser: function (id, headers) {
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
      }

    }
  });
