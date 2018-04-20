angular
  .module('QuiverCMS', [
    'ngStorage',
    'quiver.angular-utilities',
    'quiver.angularfire-authentication',
    'angular-md5',
    'angular-google-analytics',
    'ngMaterial',
  ])

  .config(function(
    quiverUtilitiesProvider,
    AngularFireAuthenticationProvider,
    AnalyticsProvider,
    $mdThemingProvider
  ) {
    /*
         * Configure Notifications
         */
    quiverUtilitiesProvider.setNotificationConfig(window.envVars.notification);

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
    var palette =
        window.envVars.theme && window.envVars.theme.palette ? window.envVars.theme.palette : false,
      isValidCustomPalette = function(palette) {
        var required = [
            '50',
            '100',
            '200',
            '300',
            '400',
            '500',
            '600',
            '700',
            '800',
            '900',
            'A100',
            'A200',
            'A300',
            'A400',
            'A700',
            'contrastDarkColors',
            'contrastLightColors',
            'contrastDefaultColor',
          ],
          keys = Object.keys(palette),
          i = required.length;
        while (i--) {
          if (!~keys.indexOf(required[i])) {
            return false;
          }
        }
        return true;
      };

    if (palette) {
      var theme = $mdThemingProvider.theme('default');

      if (palette.primary && palette.overrides && palette.overrides.primary) {
        // Extend a palette
        var customPrimary = $mdThemingProvider.extendPalette(
          palette.primary,
          palette.overrides.primary
        );
        $mdThemingProvider.definePalette('customPrimary', customPrimary);
        if (palette.intentions && palette.intentions.primary) {
          theme.primaryPalette('customPrimary', palette.intentions.primary);
        } else {
          theme.primaryPalette('customPrimary');
        }
      } else if (palette.primary && palette.intentions && palette.intentions.primary) {
        // Use a predefined Palette with custom intentions
        theme.primaryPalette(palette.primary, palette.intentions.primary);
      } else if (palette.primary) {
        // Use an unmodified palette
        theme.primaryPalette(palette.primary);
      } else if (
        palette.overrides &&
        palette.overrides.primary &&
        isValidCustomPalette(palette.overrides.primary)
      ) {
        // Create a palette
        $mdThemingProvider.definePalette('customPrimary', palette.overrides.primary);
        theme.primaryPalette('customPrimary');
      }

      if (palette.accent && palette.overrides && palette.overrides.accent) {
        // Extend a palette
        var customAccent = $mdThemingProvider.extendPalette(
          palette.accent,
          palette.overrides.accent
        );
        $mdThemingProvider.definePalette('customAccent', customAccent);
        if (palette.intentions && palette.intentions.accent) {
          theme.accentPalette('customPrimary', palette.intentions.accent);
        } else {
          theme.accentPalette('customAccent');
        }
      } else if (palette.accent && palette.intentions && palette.intentions.accent) {
        // Use a predefined Palette with custom intentions
        theme.accentPalette(palette.accent, palette.intentions.accent);
      } else if (palette.accent) {
        // Use an unmodified Palette
        theme.accentPalette(palette.accent);
      } else if (
        palette.overrides &&
        palette.overrides.accent &&
        isValidCustomPalette(palette.overrides.accent)
      ) {
        // Create a palette
        $mdThemingProvider.definePalette('customAccent', palette.overrides.accent);
        theme.accentPalette('customAccent');
      }

      if (palette.dark) {
        theme.dark();
      }
    }
  })
  .run(function() {
    angular.element(document.body).removeAttr('style');
  })
  .factory('moment', function($window) {
    return $window.moment;
  })
  .factory('_', function($window) {
    return $window._;
  })
  .service('ProductService', function() {
    return {
      setProduct: function(slug, product) {
        return localStorage.setItem('quiver-cms-product-' + slug, JSON.stringify(product));
      },

      getProduct: function(slug) {
        var product = localStorage.getItem('quiver-cms-product-' + slug);
        return product ? JSON.parse(product) : undefined;
      },
    };
  })
  .service('AdminService', function(Restangular) {
    return {
      getApiUser: function(headers) {
        return Restangular.one('user')
          .one(headers.uid)
          .one('provider')
          .one(headers.provider)
          .get({}, headers);
      },
    };
  })
  .controller('MasterCtrl', function(
    $scope,
    $http,
    $timeout,
    $localStorage,
    ProductService,
    moment,
    _,
    qvAuth,
    md5,
    Analytics,
    TrackingService,
    $location,
    $mdSidenav
  ) {
    /*
         * Angular Material
         */

    $scope.toggleSidenav = function(menuId) {
      $mdSidenav(menuId).toggle();
    };

    /*
         * User
         */
    qvAuth.getCurrentUser().then(function(currentUser) {
      $scope.currentUser = currentUser;
      $scope.showNav = true;

      if (currentUser && currentUser.email) {
        $scope.gravatar = 'https://www.gravatar.com/avatar/' + md5.createHash(currentUser.email);
      }

      if (currentUser && currentUser.uid) {
        qvAuth.getHeaders(currentUser).then(function(headers) {
          $http
            .get(window.envVars.api + '/user/' + headers.uid + '/provider/' + headers.provider, {
              headers: headers,
            })
            .then(function(res) {
              qvAuth.getUser(res.data.key).then(function(user) {
                $scope.user = user;
              });
            });
        });
      }

      if (!currentUser) {
        $localStorage.redirect = '/';
      }

      if (currentUser && location.pathname === '/') {
        location.replace('/app/');
      } else {
        $timeout(function() {
          $scope.loaded = true;
        });
      }
    });

    $scope.logOut = function(menuId) {
      qvAuth.logOut().then(function() {
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

    var getAnalyticsProduct = function(product) {
        return {
          productId: product.slug,
          name: product.title,
          category: product.type,
          brand: product.brand,
          variant: product.optionsMatrixSelected
            ? product.optionsMatrixSelected.slug
            : 'default variant',
          price: product.price,
          quantity: product.quantity || 1,
          coupon: product.coupon,
          position: product.position,
          list: product.list,
        };
      },
      getReferral = function() {
        var pairs = location.search.substr(1).split('&'),
          search = {};

        _.each(pairs, function(pair) {
          var parts = pair.split('=');

          search[parts[0]] = parts[1];
        });

        if (search.referral) {
          if ($scope.$storage.referral) {
            // Handle existing referral
            search.referral = $scope.$storage.referral.referral || search.referral;
            search.creative = $scope.$storage.referral.creative || search.creative;
            search.position = $scope.$storage.referral.position || search.position;
          } else {
            // Handle new referral
            Analytics.addPromo('referral', search.referral, search.creative, search.position);
            if (search.referral === 'facebook') {
              TrackingService.trackCustom('referral', search);
            }
          }
          $scope.$storage.referral = search;
          Analytics.pageView();
        }
      };

    getReferral();

    $scope.logProductImpression = function(product) {
      var analyticsProduct = getAnalyticsProduct(product);

      Analytics.addImpression(
        analyticsProduct.productId,
        analyticsProduct.name,
        analyticsProduct.list,
        analyticsProduct.brand,
        analyticsProduct.category,
        analyticsProduct.variant,
        analyticsProduct.position,
        analyticsProduct.price
      );
      Analytics.pageView();
      TrackingService.trackCustom('impression', analyticsProduct);
    };

    /*
         * Cart
         */
    var updateCart = function() {
      var cart = $scope.$storage.cart,
        now = moment().format(),
        item,
        i;

      if (!cart || !cart.items || !Array.isArray(cart.items)) {
        cart = {
          created: now,
          items: [],
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

    $scope.addToCart = function(slug) {
      var product = ProductService.getProduct(slug),
        analyticsProduct = getAnalyticsProduct(product),
        cart = $scope.$storage.cart,
        i,
        exists = false;

      if (!cart || !cart.items || !Array.isArray(cart.items)) {
        cart = {
          items: [],
        };
      }

      if ($scope.inCart(slug)) {
        console.warn('product already in cart');
      } else {
        cart.items.push(product);
        $scope.$storage.cart = cart;

        Analytics.addProduct(
          analyticsProduct.productId,
          analyticsProduct.name,
          analyticsProduct.category,
          analyticsProduct.brand,
          analyticsProduct.variant,
          analyticsProduct.price,
          analyticsProduct.quantity,
          analyticsProduct.coupon,
          analyticsProduct.position
        );
        Analytics.trackCart('add');
        TrackingService.track('AddToCart', {
          //    value: analyticsProduct.price * analyticsProduct.quantity,
          value: 0,
          currency: 'USD',
          content_name: 'product',
          content_ids: [analyticsProduct.productId],
        });
      }

      return updateCart();
    };

    var testEquality = function(a, b) {
      var whitelist = ['slug', 'optionsMatrixSelected', 'price', 'discount'];
      return _.isEqual(_.pick(a, whitelist), _.pick(b, whitelist));
    };

    $scope.removeFromCart = function(slug) {
      if (
        !$scope.$storage.cart ||
        !$scope.$storage.cart.items ||
        !$scope.$storage.cart.items.length
      )
        return;

      var product = ProductService.getProduct(slug),
        analyticsProduct = getAnalyticsProduct(product);

      Analytics.addProduct(
        analyticsProduct.productId,
        analyticsProduct.name,
        analyticsProduct.category,
        analyticsProduct.brand,
        analyticsProduct.variant,
        analyticsProduct.price,
        analyticsProduct.quantity,
        analyticsProduct.coupon,
        analyticsProduct.position
      );
      Analytics.trackCart('remove');

      $scope.$storage.cart.items = _.filter($scope.$storage.cart.items, function(item) {
        return !testEquality(item, product);
      });

      updateCart();
    };

    $scope.inCart = function(slug) {
      var product = ProductService.getProduct(slug),
        items =
          $scope.$storage.cart && $scope.$storage.cart.items ? $scope.$storage.cart.items : [];

      return !!_.find(items, function(item) {
        return testEquality(item, product);
      });
    };

    $scope.updateOptions = function(slug, options) {
      var product = ProductService.getProduct(slug);

      product.options = _.map(options, function(optionIndex, key) {
        return product.optionGroups[key].options[optionIndex];
      });

      product.optionsMatrixSelected = _.find(product.optionsMatrix, function(matrixItem, key) {
        //Attempt to set optionsMatrixSelected to the appropriate object.
        var selections = key.split('|'),
          keys = _.map(product.options, function(option) {
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

      if (product.optionsMatrixSelected) {
        product.optionsMatrixSelected.inStock =
          typeof product.optionsMatrixSelected.inventory === 'number'
            ? product.optionsMatrixSelected.inventory > 0
            : true;
      }

      $scope.optionsMatrixSelected = product.optionsMatrixSelected;

      ProductService.setProduct(slug, product);
      $scope.logProductImpression(ProductService.getProduct(slug));

      return product;
    };

    $scope.getPriceAdjusted = function(slug) {
      var product = ProductService.getProduct(slug);
      return product ? product.priceAdjusted : false;
    };
  });
