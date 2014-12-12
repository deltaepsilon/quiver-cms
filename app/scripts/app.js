'use strict';

angular.module('quiverCmsApp', [
  'ui.router',
  'firebase',
  'angular-markdown-editable',
  'slugifier',
  'restangular',
  'quiver.angular-utilities',
  'quiver.angularfire-authentication',
  'angular-md5',
  'ngStorage',
  'flow',
  'angular-google-analytics'
]).run(function ($rootScope, $state, Restangular, NotificationService, env, Analytics, qvAuth, AdminService, $localStorage) {
    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
      $state.previous = _.clone($state);
      $state.toState = toState;
      $state.toParams = toParams;
      $state.fromState = fromState;
      $state.fromParams = fromParams;
    });
     
    qvAuth.auth.$onAuth(function (authData) {
      if (authData && authData.uid) {
        var headers = {"authorization": authData.token, "user-id": authData.uid, "email": authData.email};

        qvAuth.getUser(authData.uid).then(function (user) {
          if (!user || !user.public || !user.private) {
            AdminService.getApiUser(authData.uid, headers).then(function () {
              AdminService.setUserEmail(authData.uid, authData.password.email);
            }, function (err) {
              console.warn('User creation error.');
            });

          } else if (!user.public.email) {
            AdminService.setUserEmail(authData.uid, authData.password.email);
            // console.log('User authenticated', user);
          }
        });

      }

    });

    Restangular.one('env').get().then(function (res) {}, function (error) {
      NotificationService.error('Server Unresponsive', 'The server could not be reached at ' + env.api + '. Try reloading the page or come back later.');
    });

}).config(function ($locationProvider, $stateProvider, $urlRouterProvider, AngularFireAuthenticationProvider, quiverUtilitiesProvider, RestangularProvider, flowFactoryProvider, AnalyticsProvider) {
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
     * Configure qvAuth
     */
    AngularFireAuthenticationProvider.setEndpoint(window.envVars.firebase.endpoint);

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
          currentUser: function (qvAuth) {
            return qvAuth.getCurrentUser();
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
          user: function ($q, $state, qvAuth) {
            var deferred = $q.defer();
            qvAuth.getCurrentUser().then(function (currentUser) {

              if (currentUser && currentUser.uid) {
                // Set up auth tokens
                var headers = {
                    "authorization": currentUser.token,
                    "user-id": currentUser.uid,
                    "email": currentUser.auth.email
                  };
                RestangularProvider.setDefaultHeaders(headers);
                flowFactoryProvider.defaults = {headers: headers, testChunks: false};

                return qvAuth.getUser(currentUser.uid);
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
          user: function ($q, $state, qvAuth, $localStorage) {
            var deferred = $q.defer();
            qvAuth.getCurrentUser().then(function (currentUser) {

              if (currentUser && currentUser.uid) {
                // Set up auth tokens
                var headers = {
                    "authorization": currentUser.token,
                    "user-id": currentUser.uid,
                    "email": currentUser.auth.email
                  };
                RestangularProvider.setDefaultHeaders(headers);
                flowFactoryProvider.defaults = {headers: headers, testChunks: false};

                return qvAuth.getUser(currentUser.uid);
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
          currentUser: function (qvAuth) {
            return qvAuth.getCurrentUser();
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
      .state('authenticated.master.nav.dashboard', {
        url: '/',
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: {
          limit: function () {
            return 5;
          },
          messagesRef: function (AdminService, user, limit) {
            return AdminService.getUserMessages(user.$id, {orderByPriority: true, limitToLast: limit});
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
      .state('authenticated.master.nav.transaction', { // **************************  Transaction **********************
        url: "/user/:userId/transaction/:key",
        templateUrl: 'views/transaction.html',
        controller: 'UserTransactionCtrl',
        resolve: {
          transactionRef: function (UserService, $stateParams) {
            return UserService.getTransaction($stateParams.userId, $stateParams.key);            
            
          }
        }
      })
      .state('authenticated.master.nav.messages', { // *****************************  Messages *************************
        url: '/messages',
        templateUrl: 'views/messages.html',
        controller: 'MessagesCtrl',
        resolve: {
          messagesRef: function (UserService, user) {
            return UserService.getMessages(user);
          }
        }  
      })
      .state('authenticated.master.nav.subscription', { // *************************  User Subscription ****************
        abstract: true,
        url: "/subscription/:subscriptionKey",
        controller: 'UserSubscriptionCtrl',
        templateUrl: 'views/subscription.html',
        resolve: {
          subscriptionRef: function (UserService, user, $stateParams) {
            return UserService.getSubscription(user.public.id, $stateParams.subscriptionKey);
          },
          pages: function(user, UserService, $stateParams) {
            return UserService.getPages(user.public.id, $stateParams.subscriptionKey);
          },
          assignments: function (UserService, user, $stateParams) {
            return UserService.getAssignments(user.public.id, $stateParams.subscriptionKey);
          }
        }
      })
      .state('authenticated.master.nav.subscription.page', {
        url: "/page/:pageNumber",
        templateUrl: '/views/page.html',
        controller: 'PageCtrl',
        resolve: {
          wordRef: function (AdminService, $stateParams, pages, $localStorage, $rootScope) {
            var keys = Object.keys(pages.pages),
              key = keys[$stateParams.pageNumber];

            $rootScope.assignmentKey = undefined;
            $rootScope.pageNumber = parseInt($stateParams.pageNumber);
            $localStorage['bookmark-' + $stateParams.subscriptionKey] = parseInt($stateParams.pageNumber);
            return AdminService.getWord(key);
          }
        }
      })
      .state('authenticated.master.nav.subscription.assignment', {
        url: "/assignment/:assignmentKey",
        templateUrl: '/views/assignment.html',
        controller: 'UserAssignmentCtrl',
        resolve: {
          assignmentRef: function (AdminService, $stateParams, $localStorage, $rootScope) {

            $rootScope.pageNumber = undefined;
            $rootScope.assignmentKey = $stateParams.assignmentKey;
            $localStorage['assignment-' + $stateParams.assignmentKey] = $stateParams.assignmentKey;
            return AdminService.getAssignment($stateParams.assignmentKey);
          },
          userAssignmentRef: function (AdminService, user, $stateParams) {
            return AdminService.getUserAssignment(user.public.id, $stateParams.assignmentKey);
          },
          userAssignmentUploadsRef: function (AdminService, user, $stateParams) {
            return AdminService.getUserAssignmentUploads(user.public.id, $stateParams.assignmentKey);
          },
          userAssignmentMessagesRef: function (AdminService, user, $stateParams) {
            return AdminService.getUserAssignmentMessages(user.public.id, $stateParams.assignmentKey);
          },
          notificationsRef: function (AdminService, currentUser) {
            return AdminService.getNotifications(currentUser.uid);
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
              isAdmin: function (user, $state) {
                if (!user.private.isAdmin) {
                  $state.go('authenticated.master.nav.dashboard');
                  return false;
                } else {
                  return true;
                }
              },
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
          limit: function () {
            return 20;
          },
          wordsRef: function (AdminService) {
            return AdminService.getWords({orderByPriority: true, limitToFirst: 20});
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
      .state('authenticated.master.admin.assignments', { // ************************  Assignments **********************
        url: '/assignments',
        templateUrl: 'views/admin-assignments.html',
        controller: 'AssignmentsCtrl',
        resolve: {
          assignmentsRef: function (AdminService) {
            return AdminService.getAssignments();
          }
        }
      })
      .state('authenticated.master.admin.assignment', {
        url: '/assignment/:key',
        templateUrl: 'views/admin-assignment.html',
        controller: 'AssignmentCtrl',
        resolve: {
          productsRef: function (AdminService) {
            return AdminService.getProducts({orderByChild: 'type', equalTo: 'subscription'});
          },
          assignmentRef: function (AdminService, $stateParams) {
            return AdminService.getAssignment($stateParams.key);
          }
        }
      })
      .state('authenticated.master.admin.files', { // ******************************  Files ****************************
        url: '/files/:search',
        templateUrl: 'views/admin-files.html',
        controller: 'FilesCtrl',
        resolve: {
          limit: function () {
            return 10;
          },
          bucket: function (AdminService) {
            return AdminService.getBucket();
          },
          originalsRef: function (AdminService, limit) {
            return AdminService.getOriginals({orderByPriority: true, limitToLast: limit});
          },
          notificationsRef: function (AdminService, currentUser) {
            return AdminService.getNotifications(currentUser.uid);
          }
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
          limit: function () {
            return 10;
          },
          usersRef: function (AdminService, limit) {
            return AdminService.getUsers({orderByPriority: true, limitToLast: limit});
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
        url: '/discounts/:search',
        templateUrl: 'views/admin-discounts.html',
        controller: 'DiscountsCtrl',
        resolve: {
          limit: function () {
            return 10;
          },
          discountsRef: function (AdminService) {
            return AdminService.getDiscounts({orderByPriority: true, limitToLast: 10});
          },
          discounts: function (AdminService) {
            return AdminService.getServerDiscounts();
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
        url: '/transactions/:search',
        templateUrl: 'views/admin-transactions.html',
        controller: 'TransactionsCtrl',
        resolve: {
          limit: function () {
            return 10;
          },
          transactionsRef: function (AdminService, limit) {
            return AdminService.getTransactions({orderByPriority: true, limitToLast: limit});
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
      })
      .state('authenticated.master.admin.subscriptions', { // ***********************  Subscriptions *******************
        url: '/subscriptions',
        templateUrl: 'views/admin-subscriptions.html',
        controller: 'SubscriptionsCtrl',
        resolve: {
          limit: function() {
            return 10;
          },
          subscriptionsRef: function(AdminService, limit) {
            return AdminService.getSubscriptions({orderByPriority: true, limitToLast: limit});
          }
        }
      })
      .state('authenticated.master.admin.subscription', { // ***********************  Subscriptions *******************
        url: '/subscription/:key',
        templateUrl: 'views/admin-subscription.html',
        controller: 'SubscriptionCtrl',
        resolve: {
          subscriptionRef: function(AdminService, $stateParams) {
            return AdminService.getSubscription($stateParams.key);
          },
          userSubscriptionRef: function (AdminService, subscriptionRef, $q) {
            return subscriptionRef.$asObject().$loaded().then(function (subscription) {
              return AdminService.getUserSubscription(subscription.user.public.id, subscription.keys.user);
            });
          }
        }
      })
      .state('authenticated.master.admin.shipments', { // **************************  Shipments ************************
        url: '/shipments/:search',
        templateUrl: 'views/admin-shipments.html',
        controller: 'ShipmentsCtrl',
        resolve: {
          limit: function () {
            return 10;
          },
          shipmentsRef: function (AdminService, limit) { 
            return AdminService.getShipments({orderByPriority: true, limitToLast: limit});
          }
        }
      })
      .state('authenticated.master.admin.messages', { // ***************************  Messages *************************
        url: '/messages/:search',
        templateUrl: 'views/admin-messages.html',
        controller: 'MessagesCtrl',
        resolve: {
          limit: function () {
            return 10;
          },
          messagesRef: function (AdminService, limit) {
            return AdminService.getMessages({orderByPriority: true, limitToLast: limit});
          }
        }
      })
      .state('authenticated.master.admin.uploads', { // ****************************  Uploads **************************
        url: '/uploads/:search',
        templateUrl: 'views/admin-uploads.html',
        controller: 'UploadsCtrl',
        resolve: {
          limit: function () {
            return 3;
          },
          uploadsRef: function (AdminService, limit) {
            return AdminService.getUploads({orderByPriority: true, limitToLast: limit});
          }
        }
      })
      .state('authenticated.master.admin.feedback', { // ***************************  Assignment ***********************
        url: '/user/:userId/feedback/:assignmentKey',
        templateUrl: 'views/admin-feedback.html',
        controller: 'FeedbackCtrl',
        resolve: {
          clientRef: function (AdminService, $stateParams) {
            return AdminService.getUser($stateParams.userId);
          },
          assignmentRef: function (AdminService, $stateParams) {
            return AdminService.getAssignment($stateParams.assignmentKey);
          },
          userAssignmentRef: function (AdminService, $stateParams) {
            return AdminService.getUserAssignment($stateParams.userId, $stateParams.assignmentKey);
          },
          assignmentUploadsRef: function (AdminService, $stateParams) {
            return AdminService.getUserAssignmentUploads($stateParams.userId, $stateParams.assignmentKey);
          },
          assignmentMessagesRef: function (AdminService, $stateParams) {
            return AdminService.getUserAssignmentMessages($stateParams.userId, $stateParams.assignmentKey);
          }
        }
      });


});
