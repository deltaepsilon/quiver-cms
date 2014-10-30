'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:CartCtrl
 * @description
 * # CartCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('CartCtrl', function ($scope, $localStorage, _, moment, products, countriesStatus, statesStatus, shippingRef, CommerceService) {
    /*
     * Storage
    */
    $scope.$storage = $localStorage;

    /*
     * Products
    */
    // Injecting loaded array

    /*
     * Commerce
    */

    $scope.countries = _.filter(CommerceService.getCountries(), function (country) {
      return countriesStatus[country['alpha-2']] ? countriesStatus[country['alpha-2']].enabled : false;
    });

    $scope.states = _.filter(CommerceService.getStates(), function (state) {
      return statesStatus[state.abbreviation] ? statesStatus[state.abbreviation].enabled : false;
    });

    $scope.shipping = shippingRef.$asObject();

    if (!$scope.$storage.address) {
      $scope.$storage.address = {};
    }

    if (!$scope.$storage.address.country) {
      $scope.$storage.address.country = 'US';
    }

    if (!$scope.$storage.address.state && $scope.$storage.address.country === 'US') {
      $scope.$storage.address.state = 'AL';
    }

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
      cart.domesticShipping = 0;
      cart.internationalShipping = 0;
      cart.productCount = 0;
      cart.updated = now;
      cart.shipped = false;
      cart.internationalAllowed = true;

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

        if (product.shipped) {
          cart.shipped = true;

          if (product.shipping) {
            if (!product.shipping.internationalAllowed) {
              cart.internationalAllowed = false;
            }

            cart.domesticShipping += (product.shipping.domesticBase || 0) + (product.shipping.domesticIncremental || 0) * product.quantity;
            cart.internationalShipping += (product.shipping.internationalBase || 0) + (product.shipping.internationalIncremental || 0) * product.quantity;

          }

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

    $scope.updateAddress = function () {
      var address = $scope.$storage.address || {},
        country = address.country ? countriesStatus[address.country] : null,
        state = address.country === 'US' && address.state ? statesStatus[address.state] : null;

      if (country.enabled && address.country === 'US' && state) {
        address.tax = (country.tax || 0) + (state.tax || 0);
        address.domestic = country.domestic;
        address.international = !country.domestic;

      } else if (country.enabled && address.country !== 'US') {
        address.tax = (country.tax || 0);
        address.domestic = country.domestic;
        address.international = !country.domestic;

      } else {
        address.tax = false;
        address.domestic = false;
        address.international = false;

      }

      $scope.$storage.address = address;
      updateCart();
    };

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
