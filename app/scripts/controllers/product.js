'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ProductCtrl
 * @description
 * # ProductCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ProductCtrl', function ($scope, productRef, productImagesRef, filesRef, $localStorage, env, $filter) {

    /*
     * Product
    */
    productRef.$asObject().$bindTo($scope, 'product');

    /*
     * Product Images
    */
    $scope.productImages = productImagesRef.$asArray();

    /*
     * localStorage
    */
    $scope.$storage = $localStorage;

    /*
     * Files
    */
    $scope.files = filesRef.$asObject();

    $scope.makeFeaturedImage = function (file) {
      $scope.product.featuredImage = file;
    };

    $scope.removeFromClipboard = function (file) {
      var fileName = $filter('filename')(file.Key);

    };

    $scope.addImage = function (file) {
      $scope.productImages.$add(file);
    };

    $scope.removeImage = function (file) {
      $scope.productImages.$remove(file);
    };


  });
