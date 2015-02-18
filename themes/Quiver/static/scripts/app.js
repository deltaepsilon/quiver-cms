angular.module('QuiverCMS', ['ngStorage', 'quiver.angular-utilities', 'quiver.angularfire-authentication', 'angular-md5'])

  .config(function (quiverUtilitiesProvider, AngularFireAuthenticationProvider) {

    /*
     * Configure Notifications
    */
    quiverUtilitiesProvider.setNotificationConfig({duration: 4000, enabled: true});

    /*
     * Configure Environment
    */
    quiverUtilitiesProvider.setEnv(window.envVars);

    /*
     * Configure qvAuth
     */
    AngularFireAuthenticationProvider.setEndpoint(window.envVars.firebase.endpoint);

  })
  // .run()
  .factory('moment', function ($window) {
    return $window.moment;
  })
  .factory('_', function ($window) {
    return $window._;
  })
  .service('ProductService', function () {
    return {
      setProduct: function (slug, product) {
        return localStorage.setItem('quiver-cms-product-' + slug, JSON.stringify(product));
      },

      getProduct: function (slug) {
        var product = localStorage.getItem('quiver-cms-product-' + slug);
        return product ? JSON.parse(product) : undefined;
      }
    };
  })
  .service('AdminService', function (Restangular) {
    return {
      getApiUser: function (headers) {
        return Restangular.one('user').one(headers.uid).one('provider').one(headers.provider).get({}, headers);
      }  
    };
    
  })
  .controller('MasterCtrl', function ($scope, $http, $timeout, $localStorage, ProductService, moment, _, qvAuth, md5) {
    /*
     * User
    */
    qvAuth.getCurrentUser().then(function (currentUser) {
      $scope.currentUser = currentUser;
      $scope.showNav = true;

      if (currentUser && currentUser.email) {
        $scope.gravatar = "https://www.gravatar.com/avatar/" + md5.createHash(currentUser.email);
      }

      if (currentUser && currentUser.uid) {
        var headers = qvAuth.getHeaders(currentUser);
        $http.get(window.envVars.api + '/user/' + headers.uid + '/provider/' + headers.provider, {headers: headers}).then(function (res) {
          qvAuth.getUser(res.data.key).then(function (user) {
            $scope.user = user;
          });
        });

      }

      if (!currentUser) {
        $localStorage.redirect = '/';
      }


    });

    $scope.logOut = function () {
      qvAuth.logOut().then(function () {
        delete $scope.currentUser;
        delete $scope.user;
      });
    };

    /*
     * Storage
    */
    $scope.$storage = $localStorage;

    /*
     * Cart
    */
    var updateCart = function () {
      var cart = $scope.$storage.cart,
        now = moment().format(),
        item,
        i;

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
      cart.productCount = 0;
      cart.updated = now;

      i = cart.items.length;



      while (i--) {
        item = cart.items[i];

        item.quantity = 1;

        if (!item) {
          cart.splice(i, 1);
        } else {
          cart.productCount += 1;
          cart.subtotal += item.price + (item.priceAdjustment || 0);
        }

      }

      cart.total = cart.subtotal + cart.tax + cart.shipping;

      $scope.$storage.cart = cart;

    };

    $scope.addToCart = function (slug) {
      var product = ProductService.getProduct(slug),
      cart = $scope.$storage.cart,
      i,
      exists = false;

      if (!cart || !cart.items || !Array.isArray(cart.items)) {
        cart = {
          items: []
        };
      }

      if ($scope.inCart(slug)) {
        console.warn('product already in cart');
      } else {
        cart.items.push(product);
        $scope.$storage.cart = cart;
      }

      return updateCart();

    };

    var testEquality = function (a, b) {
      var whitelist = ['slug', 'optionsMatrixSelected', 'price', 'discount'];
      return _.isEqual(_.pick(a, whitelist), _.pick(b, whitelist));
    };

    $scope.removeFromCart = function (slug) {
      if (!$scope.$storage.cart || !$scope.$storage.cart.items || !$scope.$storage.cart.items.length) return;

      var product = ProductService.getProduct(slug);

      $scope.$storage.cart.items = _.filter($scope.$storage.cart.items, function (item) {
        return !testEquality(item, product);
      });

      updateCart();
    };

    $scope.inCart = function (slug) {
      var product = ProductService.getProduct(slug),
        items = $scope.$storage.cart && $scope.$storage.cart.items ? $scope.$storage.cart.items : [];

      return !!_.find(items, function (item) {
        return testEquality(item, product);
      });

    };

    $scope.updateOptions = function (slug, options) {
      var product = ProductService.getProduct(slug);

      product.options = _.map(options, function (optionIndex, key) {
        return product.optionGroups[key].options[optionIndex];
      });

      product.optionsMatrixSelected = _.find(product.optionsMatrix, function (matrixItem, key) { //Attempt to set optionsMatrixSelected to the appropriate object.
        var selections = key.split('|'),
          keys = _.map(product.options, function (option) {
            return option ? option.slug : false;
          }),
          i = keys.length;

        if (selections.length !== i) {
          return false;
        }

        while (i--) {
          if (!~selections.indexOf(keys[i])) {
            return false;
          }
        }

        return true;

      });

      if (product.optionsMatrixSelected && product.optionsMatrixSelected.priceDifference) {
        product.priceAdjusted = product.price + product.optionsMatrixSelected.priceDifference;
      } else {
        delete product.priceAdjusted;
      }

      ProductService.setProduct(slug, product);

      return product;

    };

    $scope.getPriceAdjusted = function (slug) {
      var product = ProductService.getProduct(slug);
      return product ? product.priceAdjusted : false;
    };

  });
