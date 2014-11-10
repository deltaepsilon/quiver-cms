'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:CartCtrl
 * @description
 * # CartCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('CartCtrl', function ($scope, $localStorage, _, moment, products, countriesStatus, statesStatus, shippingRef, clientToken, CommerceService, NotificationService, braintree, ObjectService) {
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
      cart.discount = 0;
      cart.domesticShipping = 0;
      cart.internationalShipping = 0;
      cart.productCount = 0;
      cart.updated = now;
      cart.shipped = false;
      cart.taxable = false;
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

        if (product.taxable) {
          cart.taxable = true;
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

      if (cart.codes && cart.codes.length) {
        var applied = [];
        // Reduce codes to a unique list and then refresh them from the Firebase Discounts array. Will likely require a new server route for security purposes...

        _.each(cart.codes, function (code) {
          if (code.productSlug && !_.findWhere(cart.items, {slug: code.productSlug})) { // Screen off product-specific codes
            return NotificationService.notify(code.code, 'Code is product-specific. Product not found in cart.');
          }

          if (~applied.indexOf(code.code)) {
            return NotificationService.notify(code.code, 'Duplicate code must be ignored!'); 
          }

          if (code.useCount >= code.uses) {
            return NotificationService.notify(code.code, 'Code has been used too many times!');  
          }

          if (!code.active) {
            return NotificationService.notify(code.code, 'Code inactive!');  
          }          

          if (cart.code.type === 'value') {
            cart.discount = cart.code.value;
          } else if (cart.code.type === 'percentage') {
            cart.discount = cart.subtotal * cart.code.percentage;
          }

          applied.push(code.code);

        });
        
      }

      if (!cart.shipped || (typeof $scope.shipping.minOrder === 'number' && cart.subtotal > $scope.shipping.minOrder)) {
        cart.shipping = 0;
        cart.freeShipping = true;
      }

      cart.total = cart.subtotal + cart.tax + cart.shipping - cart.discount;

      $scope.$storage.cart = cart;
    };

    $scope.updateCart = updateCart;

    /*
     * Address
    */
    $scope.editAddress = function () {
      $scope.validateAddress($scope.$storage.address);
      $scope.editingAddress = true;
    };

    $scope.removeAddress = function () {
      $scope.$storage.address = false;
      $scope.$storage.cart.address = false;
    };

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

    $scope.validateAddress = function (address) {
      var address = address || {},
        country = address.country ? _.findWhere(CommerceService.getCountries(), {'alpha-2': address.country}) : null,
        state = address.country === 'US' ? _.findWhere(CommerceService.getStates(), {'abbreviation': address.state}) : null,
        territory = address.territory,
        formattedAddress = {
          recipient: address.recipient,
          street1: address.street1 && address.street1.length ? address.street1 : null,
          street2: address.street2 && address.street2.length ? address.street2 : null,
          street3: address.street3 && address.street3.length ? address.street3 : null,
          city: address.city,
          territory: state ? state.abbreviation : address.territory,
          territoryName: state ? state.name : address.territory,
          country: country ? country['alpha-2'] : null,
          countryName: country ? country.name : null,
          postalCode: address.postalCode,
          isUS: address.country === 'US',
          instructions: address.instructions
        },
        errorMessages = {};

      if (!formattedAddress.recipient) {
        errorMessages.recipient = 'Missing recipient name.';
      }        

      if (!formattedAddress.street1) {
        errorMessages.street = 'Missing street line 1.';
      }

      if (!formattedAddress.city) {
        errorMessages.city = 'Missing city.';
      }

      if (!formattedAddress.territory) {
        if (address.country === 'US') {
          errorMessages.territory = 'Missing state.';
        } else {
          errorMessages.territory = 'Missing territory.';
        }

      }

      if (!formattedAddress.country) {
        errorMessages.country = 'Missing country.';
      }

      if (!formattedAddress.postalCode) {
        errorMessages.postalCode = 'Missing postal code.';
      }

      $scope.errorMessages = errorMessages;

      return !Object.keys(errorMessages).length ? formattedAddress : false;

    };

    if (!$scope.$storage.cart || !$scope.$storage.cart.address || !$scope.validateAddress($scope.$storage.cart.address)) {
      $scope.editingAddress = true;
    } else {
      $scope.editingAddress = false;
    }

    $scope.saveAddress = function (address) {
      var address = $scope.validateAddress(address);

      if (address) {
        $scope.$storage.cart.address = address;
        $scope.editingAddress = false;
      } else {
        $scope.editingAddress = true;
      }

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

    $scope.addCode = function (code) {
      CommerceService.getCode(code).then(function (codeObject) {
        var existing = ;

        if (!$scope.$storage.cart.codes) {
          $scope.$storage.cart.codes = [];
        }

        if (_.findWhere($scope.$storage.codes, {code: codeObject.code})) {
          NotificationService.notify(codeObject.code, 'Code already present in cart.');
        } else {
          $scope.$storage.cart.codes.push(ObjectService.cleanRestangular(codeObject));
          $scope.addingCode = false;
          updateCart();
        }
        
      }, function (err) {
        NotificationService.error(code, err || 'Code not found.');
      });
    };

    $scope.removeCodes = function () {
      $scope.$storage.cart.code = false;
      updateCart();
    };

    /*
     * Checkout
     */
    $scope.clientToken = clientToken;
    
    $scope.removePaymentMethod = function (token) {
      if (token === $scope.$storage.cart.paymentToken) {
        $scope.$storage.cart.paymentToken = false;
      }

      CommerceService.removePaymentMethod(token).then(function (response) {
        if (response.error) {
          NotificationService.error('Card Error', response.error);
        } else {
          NotificationService.success('Card Removed');
        }
      }, function (err) {
        NotificationService.error('Card Error', err);
      });
    };

    
    $scope.submitCheckout = function (e) {
      debugger;
      console.log('submitCheckout', e, arguments);
    };

  });
