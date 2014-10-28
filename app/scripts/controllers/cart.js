'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:CartCtrl
 * @description
 * # CartCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('CartCtrl', function ($scope, $localStorage, _, moment, products) {
    /*
     * Storage
    */
    $scope.$storage = $localStorage;

    /*
     * Products
    */
    // Injecting loaded array


    /*
     * Cart
    */
    var updateCart = function () {
      var cart = $scope.$storage.cart,
        now = moment().format(),
        item,
        i,
        product;

      if (!cart || !cart.items || !Array.isArray(cart.items)) {
        cart = {
          created: now,
          items: []
        };
      }

      cart.productCount = 0;
      cart.subTotal = 0;
      cart.tax = 0;
      cart.shipping = 0;
      cart.productCount = 0;
      cart.updated = now;

      i = cart.items.length;



      while (i--) {
        item = cart.items[i];

        // Update cart item with latest product specs
        product = _.find(products, function (product) {
          return product.slug === item.slug;
        });

        product = _.clone(product);

        if (item.optionsMatrixSelected) {
          product.optionsMatrixSelected = product.optionsMatrix[item.optionsMatrixSelected.slug];
          product.priceAdjusted = product.price + (product.optionsMatrixSelected.priceDifference || 0);
        }

        product.quantity = item.quantity;

        if (!product.quantity || product.quantity < 1) {
          product.quantity = 1;
        }

        if (product.inventory || product.inventory === 0) {
          product.maxQuantity = product.inventory;
        } else if (product.optionsMatrixSelected && (product.optionsMatrixSelected.inventory || product.optionsMatrixSelected.inventory === 0)) {
          product.maxQuantity = product.optionsMatrixSelected.inventory;
        }

        if (product.maxQuantity) {
          product.quantity = Math.min(product.quantity, product.maxQuantity);
        }

        if (!product) {
          cart.items.splice(i, 1);
        } else {
          cart.items.splice(i, 1, product); // Update item in place
          cart.productCount += 1;
          cart.subTotal += (product.priceAdjusted || product.price);
        }

      }

      cart.total = cart.subTotal + cart.tax + cart.shipping;

      $scope.$storage.cart = cart;
    };
    updateCart();
    $scope.updateCart = updateCart;

    $scope.removeFromCart = function (product) {
      var items = $scope.$storage.cart.items,
        i = items.length;

      while (i--) {
        if (_.isEqual(product, items[i])) {
          $scope.$storage.cart.items.splice(i, 1);
        }
      }

      updateCart();
    };

  });
