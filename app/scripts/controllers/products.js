'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ProductsCtrl
 * @description
 * # ProductsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ProductsCtrl', function ($scope, productsRef, Slug) {
    $scope.products = productsRef.$asArray();

    $scope.addProduct = function (newProduct) {
        newProduct.slug = Slug.slugify(newProduct.title);
        newProduct.type = 'physical';
        $scope.products.$add(newProduct);
    };
  });
