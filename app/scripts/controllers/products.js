'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ProductsCtrl
 * @description
 * # ProductsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ProductsCtrl', function ($scope, products, files, Slug) {

    /*
     * Products
    */
    $scope.products = products;

    $scope.addProduct = function (newProduct) {
        newProduct.slug = Slug.slugify(newProduct.title);
        newProduct.type = 'physical';
        $scope.products.$add(newProduct);
        delete $scope.newProduct;
    };

    $scope.removeProduct = function (product) {
        $scope.products.$remove(product);
    };

    /*
     * Files
    */
    $scope.files = files;


  });
