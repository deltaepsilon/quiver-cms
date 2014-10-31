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

    var shipping = shippingRef.$asObject(); // Shipping gets assigned to $scope later...

    $scope.countries = _.filter(CommerceService.getCountries(), function (country) {
      return countriesStatus[country['alpha-2']] ? countriesStatus[country['alpha-2']].enabled : false;
    });

    $scope.states = _.filter(CommerceService.getStates(), function (state) {
      return statesStatus[state.abbreviation] ? statesStatus[state.abbreviation].enabled : false;
    });

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
      cart.subtotal = 0;
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

        product.quantity = item.quantity || 0;

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
          cart.subtotal += (product.priceAdjusted || product.price) * product.quantity;

          if ($scope.$storage.address) {
            if (product.taxable && $scope.$storage.address.tax) {
              cart.tax += (product.priceAdjusted || product.price) * product.quantity * $scope.$storage.address.tax;
            }

          }

        }

      }

      if ($scope.$storage.address) {
        if ($scope.$storage.address.domestic) {
          cart.shipping = cart.domesticShipping + ($scope.shipping.domesticBaseRate || 0);
        } else if ($scope.$storage.address.international) {
          cart.shipping = cart.internationalShipping + ($scope.shipping.internationalBaseRate || 0);
        }
      }

      cart.subtotal = Math.round(cart.subtotal * 100) / 100;
      cart.tax = Math.round(cart.tax * 100) / 100;
      cart.shipping = Math.round(cart.shipping * 100) / 100;

      if (typeof $scope.shipping.minOrder === 'number' && cart.subtotal > $scope.shipping.minOrder) {
        cart.shipping = 0;
        cart.freeShipping = true;
      }

      cart.total = cart.subtotal + cart.tax + cart.shipping;

      $scope.$storage.cart = cart;
    };

    $scope.updateCart = updateCart;

    /*
     * Address
    */
    $scope.updateAddress = function () {
      var address = $scope.$storage.address || {},
        country = address.country ? countriesStatus[address.country] : null,
        state = address.country === 'US' && address.state ? statesStatus[address.state] : null;

      if (country && country.enabled && address.country === 'US' && state) {
        address.tax = (country.tax || 0) + (state.tax || 0);
        address.domestic = country.domestic;
        address.international = !country.domestic;

      } else if (country && country.enabled && address.country !== 'US') {
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

    /*
     * Shipping
    */
    shipping.$loaded().then(function (shipping) {
      $scope.shipping = shipping;
      $scope.updateAddress();
    });

    /*
     * Cart Actions
    */
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
