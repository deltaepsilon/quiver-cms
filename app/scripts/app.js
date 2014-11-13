'use strict';

angular.module('quiverCmsApp', [
  'ui.router',
  'firebase',
  'angular-markdown-editable',
  'slugifier',
  'restangular',
  'DeltaEpsilon.quiver-angular-utilities',
  'angular-md5',
  'ngStorage',
  'flow',
  'angular-google-analytics'
]).run(function ($rootScope, $state, Restangular, NotificationService, env, Analytics) {
    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
      $state.previous = _.clone($state);
      $state.toState = toState;
      $state.toParams = toParams;
      $state.fromState = fromState;
      $state.fromParams = fromParams;
    });

    Restangular.one('env').get().then(function (res) {}, function (error) {
      NotificationService.error('Server Unresponsive', 'The server could not be reached at ' + env.api + '. Try reloading the page or come back later.');
    });

}).config(function ($locationProvider, $stateProvider, $urlRouterProvider, quiverUtilitiesProvider, RestangularProvider, flowFactoryProvider, AnalyticsProvider) {
    /*
     * HTML5 Mode
    */
    if (window.envVars.html5Mode) {
      $locationProvider.html5Mode(true).hashPrefix('!');
    }

    /*
     * Configure Restangular
    */
    RestangularProvider.setBaseUrl(window.envVars.api);

    /*
     * Configure Notifications
    */
    quiverUtilitiesProvider.setNotificationConfig({duration: 4000, enabled: true});

    /*
     * Configure Environment
    */
    quiverUtilitiesProvider.setEnv(window.envVars);

    /*
     * Configure Default Route
    */
    $urlRouterProvider.otherwise('/app/');

    /*
     * Analytics
    */
    if (window.envVars.google && window.envVars.google.analyticsId) {
      AnalyticsProvider.setAccount(window.envVars.google.analyticsId);
      AnalyticsProvider.trackPages(true);
      AnalyticsProvider.useAnalytics(true);
      AnalyticsProvider.ignoreFirstPageLoad(true);
      AnalyticsProvider.useECommerce(true);
      AnalyticsProvider.setPageEvent('$stateChangeSuccess');
    }


    /*
     * Convenience methods
     */
    var getUser = function ($q, $state, UserService, currentUser) {
      if (currentUser && currentUser.id) {
        // The easy case... currentUser was resolved earlier.
        return UserService.getUser(currentUser.id);

      } else {
        var deferred = $q.defer();
        UserService.getUser().then(function (currentUser) {
          if (currentUser && currentUser.id) {
            return UserService.getUser(currentUser.id);
          } else {
            // Dump users without auth to main page.
            $state.go('master.nav.landing');
          }

        }).then(deferred.resolve, deferred.reject);

        /*
         * The user may be logged in, but hit the page without auth,
         * so currentUser was not resolved on the initial page load.
        */
        return deferred.promise;

      }
    };

    /*
     * Configure states
    */

    $stateProvider
      /*
       * Non-auth routes
      */
      .state('master', {
      url: '/app',
        abstract: true,
        templateUrl: 'views/master.html',
        controller: 'MasterCtrl',
        resolve: {
          currentUser: function (UserService) {
            return UserService.getUser();
          },
          settingsRef: function ($q, AdminService) {
            var deferred = $q.defer(),
             settingsRef = AdminService.getSettings();
             settingsRef.$asObject().$loaded(function () {
               deferred.resolve(settingsRef);
             });

            return deferred.promise
          },
          filesRef: function (AdminService) {
            return AdminService.getFiles();
          },
          user: function ($q, $state, UserService) {
            var deferred = $q.defer();
            UserService.getUser().then(function (currentUser) {

              if (currentUser && currentUser.id) {
                // Set up auth tokens
                window.envVars.firebaseAuthToken = currentUser.firebaseAuthToken;
                quiverUtilitiesProvider.setEnv(window.envVars);

                var headers = {
                    "authorization": currentUser.firebaseAuthToken,
                    "user-id": currentUser.id
                  };
                RestangularProvider.setDefaultHeaders(headers);
                flowFactoryProvider.defaults = {headers: headers, testChunks: false};

                return UserService.getUser(currentUser.id);
              } else {
                deferred.resolve();
              }

            }).then(deferred.resolve, deferred.reject);

            /*
             * The user may be logged in, but hit the page without auth,
             * so currentUser was not resolved on the initial page load.
            */
            return deferred.promise; //
          }
        }
      })
      .state('master.nav', {
        abstract: true,
        views: {
          nav: {
            templateUrl: 'views/nav.html'
          },
          body: {
            templateUrl: 'views/body.html'
          },
          footer: {
            templateUrl: 'views/footer.html'
          }
        }
      })
      .state('master.nav.landing', {
        url: '/',
        templateUrl: 'views/landing.html',
        controller: 'LandingCtrl'
      })
      .state('master.nav.login', {
        url: '/login',
        templateUrl: 'views/login.html',
        controller: 'AuthCtrl'
      })
      .state('master.nav.register', {
        url: '/register',
        templateUrl: 'views/register.html',
        controller: 'AuthCtrl'
      })
      .state('master.nav.reset', {
        url: '/reset',
        templateUrl: 'views/reset.html',
        controller: 'AuthCtrl'
      })
      .state('master.nav.content', {
        url: '/content/:slug'
      })
      .state('master.nav.cart', {
        url: '/cart',
        templateUrl: 'views/cart.html',
        controller: 'CartCtrl',
        resolve: {
          products: function (AdminService, $q) {
            var deferred = $q.defer();

            AdminService.getProducts().$asArray().$loaded(function (products) {
              deferred.resolve(products);
            });

            return deferred.promise;
          },
          countriesStatus: function (AdminService, $q) {
            var deferred = $q.defer();

            AdminService.getCountries().$asObject().$loaded().then(function (countriesStatus) {
              deferred.resolve(countriesStatus);
            }, deferred.reject);

            return deferred.promise;
          },
          statesStatus: function (AdminService, $q) {
            var deferred = $q.defer();

            AdminService.getStates().$asObject().$loaded().then(function (statesStatus) {
              deferred.resolve(statesStatus);
            }, deferred.reject);

            return deferred.promise;
          },
          shippingRef: function (AdminService) {
            return AdminService.getShipping();
          },
          clientToken: function () {
            return false;
          }
        }
      })

      /*
       * Authenticated routes
      */
      .state('authenticated', { // *************************************************  Authentication  ******************
        abstract: true,
        templateUrl: 'views/authenticated.html',
        controller: 'AuthenticatedCtrl',
        resolve: {
          user: function ($q, $state, UserService, $localStorage) {
            var deferred = $q.defer();
            UserService.getUser().then(function (currentUser) {

              if (currentUser && currentUser.id) {
                // Set up auth tokens
                window.envVars.firebaseAuthToken = currentUser.firebaseAuthToken;
                quiverUtilitiesProvider.setEnv(window.envVars);

                var headers = {
                    "authorization": currentUser.firebaseAuthToken,
                    "user-id": currentUser.id
                  };
                RestangularProvider.setDefaultHeaders(headers);
                flowFactoryProvider.defaults = {headers: headers, testChunks: false};

                return UserService.getUser(currentUser.id);
              } else {
                // Dump users without auth to login.
                $localStorage.redirect = {
                  toState: $state.toState,
                  toParams: $state.toParams
                };
                $state.go('master.nav.login');
              }

            }).then(deferred.resolve, deferred.reject);
            /*
             * The user may be logged in, but hit the page without auth,
             *  so currentUser was not resolved on the initial page load.
            */
            return deferred.promise;
          }
        }
      })
      .state('authenticated.master', {
        url: '/app',
        abstract: true,
        templateUrl: 'views/master.html',
        controller: 'MasterCtrl',
        resolve: {
          currentUser: function (UserService) {
            return UserService.getUser();
          },
          settingsRef: function (AdminService) {
            return AdminService.getSettings();
          },
          filesRef: function (AdminService) {
            return AdminService.getFiles();
          }
        }
      })
      .state('authenticated.master.nav', {
        abstract: true,
        views: {
          nav: {
            templateUrl: 'views/nav.html'
          },
          body: {
            templateUrl: 'views/body.html'
          },
          footer: {
            templateUrl: 'views/footer.html'
          }
        }
      })
      .state('authenticated.master.nav.account', { // ******************************  Account **************************
        url: "/account",
        templateUrl: 'views/account.html',
        controller: 'AccountCtrl'
      })
      .state('authenticated.master.nav.checkout', { // *****************************  Checkout *************************
        url: "/checkout",
        templateUrl: 'views/checkout.html',
        controller: 'CartCtrl',
        resolve: {
          products: function (AdminService, $q) {
            var deferred = $q.defer();

            AdminService.getProducts().$asArray().$loaded(function (products) {
              deferred.resolve(products);
            });

            return deferred.promise;
          },
          countriesStatus: function (AdminService, $q) {
            var deferred = $q.defer();

            AdminService.getCountries().$asObject().$loaded().then(function (countriesStatus) {
              deferred.resolve(countriesStatus);
            }, deferred.reject);

            return deferred.promise;
          },
          statesStatus: function (AdminService, $q) {
            var deferred = $q.defer();

            AdminService.getStates().$asObject().$loaded().then(function (statesStatus) {
              deferred.resolve(statesStatus);
            }, deferred.reject);

            return deferred.promise;
          },
          shippingRef: function (AdminService) {
            return AdminService.getShipping();
          },
          clientToken: function (CommerceService, user) {
            return CommerceService.getClientToken();
          }

        }
      })
      .state('authenticated.master.nav.purchased', {
        url: "/purchased/:nonce",
        templateUrl: 'views/purchased.html',
        controller: 'PurchasedCtrl',
        resolve: {
          transaction: function (user, CommerceService, $stateParams, $state, $localStorage) {
            if (!$localStorage.cart) {
              $state.go('authenticated.master.nav.cart');
            } else {
              $localStorage.cart.nonce = $stateParams.nonce;
              return CommerceService.purchase($localStorage.cart);
            }
            
            
          }
        }
      })
      /*
       * Admin routes
      */
      .state('authenticated.master.admin', { // ************************************  Admin ****************************
        url: '/admin',
        views: {
          nav: {
            templateUrl: 'views/admin-nav.html'
          },
          body: {
            templateUrl: 'views/body.html',
            controller: "AdminCtrl",
            resolve: {
              themeRef: function (AdminService) {
                return AdminService.getTheme();
              },
              settingsRef: function (AdminService) {
                return AdminService.getSettings();
              }
            }
          }
        }
      })
      .state('authenticated.master.admin.words', { // ******************************  Words ****************************
        url: '/words',
        templateUrl: 'views/admin-words.html',
        controller: 'WordsCtrl',
        resolve: {
          wordsRef: function (AdminService) {
            return AdminService.getWords();
          },
          hashtagsRef: function (AdminService) {
            return AdminService.getHashtags();
          }
        }
      })
      .state('authenticated.master.admin.word', {
        url: '/words/:key',
        templateUrl: 'views/admin-word.html',
        controller: 'WordCtrl',
        resolve: {
          wordRef: function (AdminService, $stateParams) {
            return AdminService.getWord($stateParams.key);
          },
          draftsRef: function (AdminService, $stateParams) {
            return AdminService.getDrafts($stateParams.key);
          },
          filesRef: function ($q, AdminService) {
            var deferred = $q.defer(),
              filesRef = AdminService.getFiles();

            filesRef.$asObject().$loaded(function () {
              deferred.resolve(filesRef);
            });

            return deferred.promise;
          }
        }
      })
      .state('authenticated.master.admin.files', { // ******************************  Files ****************************
        url: '/files',
        templateUrl: 'views/admin-files.html',
        controller: 'FilesCtrl',
        resolve: {
          filesRef: function (AdminService) {
            return AdminService.getFiles();
          },
          notificationsRef: function (AdminService, currentUser) {
            return AdminService.getNotifications(currentUser.id);
          },
        }
      })
      .state('authenticated.master.admin.products', { // ***************************  Products *************************
        url: '/products',
        templateUrl: 'views/admin-products.html',
        controller: 'ProductsCtrl',
        resolve: {
          productsRef: function (AdminService) {
            return AdminService.getProducts();
          },
          filesRef: function (AdminService) {
            return AdminService.getFiles();
          }
        }
      })
      .state('authenticated.master.admin.product', {
        url: '/product/:key',
        templateUrl: 'views/admin-product.html',
        controller: 'ProductCtrl',
        resolve: {
          productRef: function (AdminService, $stateParams) {
            return AdminService.getProduct($stateParams.key);
          },
          productImagesRef: function (AdminService, $stateParams) {
            return AdminService.getProductImages($stateParams.key);
          },
          productOptionGroupsRef: function (AdminService, $stateParams) {
            return AdminService.getProductOptionGroups($stateParams.key);
          },
          productOptionsMatrixRef: function (AdminService, $stateParams) {
            return AdminService.getProductOptionsMatrix($stateParams.key);
          },
          filesRef: function (AdminService) {
            return AdminService.getFiles();
          },
          hashtagsRef: function (AdminService) {
            return AdminService.getHashtags();
          }

        }
      })
      .state('authenticated.master.admin.users', { // ******************************  Users ****************************
        url: '/users',
        templateUrl: 'views/admin-users.html',
        controller: 'UsersCtrl',
        resolve: {
          usersRef: function (AdminService) {
            return AdminService.getUsers();
          }
        }
      })
      .state('authenticated.master.admin.user', {
        url: '/user/:key',
        templateUrl: 'views/admin-user.html',
        controller: 'UserCtrl',
        resolve: {
          userRef: function (AdminService, $stateParams) {
            return AdminService.getUser($stateParams.key);
          }
        }
      })
      .state('authenticated.master.admin.settings', { // ***************************  Settings *************************
        url: '/settings',
        templateUrl: 'views/admin-settings.html',
        controller: 'SettingsCtrl'
      })
      .state('authenticated.master.admin.commerce', {
        url: '/commerce',
        templateUrl: 'views/admin-commerce.html',
        controller: 'CommerceCtrl',
        resolve: {
          commerceRef: function (AdminService) {
            return AdminService.getCommerce();
          },
          countries: function (CommerceService) {
            return CommerceService.getCountries();
          },
          states: function (CommerceService) {
            return CommerceService.getStates();
          }
        }
      })
      .state('authenticated.master.admin.discounts', { // **************************  Discounts ************************
        url: '/discounts',
        templateUrl: 'views/admin-discounts.html',
        controller: 'DiscountsCtrl',
        resolve: {
          discountsRef: function (AdminService) {
            return AdminService.getDiscounts();
          }
        }
      })
      .state('authenticated.master.admin.social', { // *****************************  Social ***************************
        url: '/social-media',
        templateUrl: 'views/admin-social.html',
        controller: 'SocialCtrl',
        resolve: {
          socialRef: function (AdminService) {
            return AdminService.getSocial();
          },
          instagramTermsRef: function (AdminService) {
            return AdminService.getInstagramTerms();
          }
        }
      })
      .state('authenticated.master.admin.hashtags', { // ***************************  Hashtags *************************
        url: '/hashtags',
        templateUrl: 'views/admin-hashtags.html',
        controller: 'HashtagsCtrl',
        resolve: {
          hashtagsRef: function (AdminService) {
            return AdminService.getHashtags();
          }
        }
      })
      .state('authenticated.master.admin.transactions', { // ***********************  Transactions *********************
        url: '/transactions',
        templateUrl: 'views/admin-transactions.html',
        controller: 'TransactionsCtrl',
        resolve: {
          transactionsRef: function (AdminService) {
            return AdminService.getTransactions();
          }
        }
      })
      .state('authenticated.master.admin.transaction', {
        url: '/transaction/:key/user/:userId',
        templateUrl: 'views/admin-transaction.html',
        controller: 'TransactionCtrl',
        resolve: {
          transactionRef: function (AdminService, $stateParams) {
            return AdminService.getTransaction($stateParams.key);
          },
          userTransactionRef: function (AdminService, $stateParams) {
            return AdminService.getUserTransaction($stateParams.userId, $stateParams.key);
          }
        }
      });


});
