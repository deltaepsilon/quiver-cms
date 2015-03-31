angular.module('QuiverCMS', ['ngStorage', 'quiver.angular-utilities', 'quiver.angularfire-authentication', 'angular-md5', 'angular-google-analytics', 'ngMaterial'])

  .config(function (quiverUtilitiesProvider, AngularFireAuthenticationProvider, AnalyticsProvider, $mdThemingProvider) {

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

    /*
     * Analytics
    */
    if (window.envVars.google && window.envVars.google.analyticsId) {
      AnalyticsProvider.setAccount(window.envVars.google.analyticsId);
      AnalyticsProvider.trackPages(true);
      AnalyticsProvider.useAnalytics(true);
      AnalyticsProvider.useECommerce(true, true);
      AnalyticsProvider.useEnhancedLinkAttribution(true);
    }

    /*
     * Angular Material
     */
    $mdThemingProvider.theme('default').primaryPalette('blue-grey', {
      'default': '900'
    }).accentPalette('pink',{});

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
  .controller('MasterCtrl', function ($scope, $http, $timeout, $localStorage, ProductService, moment, _, qvAuth, md5, Analytics, $location, $mdSidenav) {
    /*
     * Angular Material
     */

    $scope.toggleSidenav = function (menuId) {
      $mdSidenav(menuId).toggle();  
    };

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

    $scope.logOut = function (menuId) {
      qvAuth.logOut().then(function () {
        delete $scope.currentUser;
        delete $scope.user;
        if (menuId) {
          $mdSidenav(menuId).close();  
        }
        
      });
    };

    /*
     * Storage
    */
    $scope.$storage = $localStorage;

    /*
     * Analytics
     */

    var getAnalyticsProduct = function (product) {
         return {
          productId: product.slug,
          name: product.title,
          category: product.type,
          brand: product.brand,
          variant: product.optionsMatrixSelected ? product.optionsMatrixSelected.slug : 'default variant',
          price: product.price,
          quantity: product.quantity || 1,
          coupon: product.coupon,
          position: product.position,
          list: product.list
         }  
      },
      getReferral = function () {
        var pairs = location.search.substr(1).split('&'),
          search = {};

          _.each(pairs, function (pair) {
            var parts = pair.split('=');

            search[parts[0]] = parts[1];
          });

        if (search.referral) {
          $scope.$storage.affiliate = search;
          Analytics.addPromo('referral', search.referral, search.creative, search.position);
          Analytics.pageView();
        }

      };

    getReferral();

    $scope.logProductImpression = function (product) {
      var analyticsProduct = getAnalyticsProduct(product);

      Analytics.addImpression(analyticsProduct.productId, analyticsProduct.name, analyticsProduct.list, analyticsProduct.brand, analyticsProduct.category, analyticsProduct.variant, analyticsProduct.position, analyticsProduct.price);
      Analytics.pageView();
    };

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
        analyticsProduct = getAnalyticsProduct(product),
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

        Analytics.addProduct(analyticsProduct.productId, analyticsProduct.name, analyticsProduct.category, analyticsProduct.brand, analyticsProduct.variant, analyticsProduct.price, analyticsProduct.quantity, analyticsProduct.coupon, analyticsProduct.position);
        Analytics.trackCart('add');

      }

      return updateCart();

    };

    var testEquality = function (a, b) {
      var whitelist = ['slug', 'optionsMatrixSelected', 'price', 'discount'];
      return _.isEqual(_.pick(a, whitelist), _.pick(b, whitelist));
    };

    $scope.removeFromCart = function (slug) {
      if (!$scope.$storage.cart || !$scope.$storage.cart.items || !$scope.$storage.cart.items.length) return;

      var product = ProductService.getProduct(slug),
        analyticsProduct = getAnalyticsProduct(product);

      Analytics.addProduct(analyticsProduct.productId, analyticsProduct.name, analyticsProduct.category, analyticsProduct.brand, analyticsProduct.variant, analyticsProduct.price, analyticsProduct.quantity, analyticsProduct.coupon, analyticsProduct.position);
      Analytics.trackCart('remove');

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

      $scope.optionsMatrixSelected = product.optionsMatrixSelected;
      console.log('optionsMatrixSelected', $scope.optionsMatrixSelected);

      ProductService.setProduct(slug, product);
      $scope.logProductImpression(ProductService.getProduct(slug));

      return product;

    };

    $scope.getPriceAdjusted = function (slug) {
      var product = ProductService.getProduct(slug);
      return product ? product.priceAdjusted : false;
    };

  });
