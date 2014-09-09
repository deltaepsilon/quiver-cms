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
  'flow'
]).config(function ($stateProvider, $urlRouterProvider, quiverUtilitiesProvider, RestangularProvider) {
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
    $urlRouterProvider.otherwise('/');

    /*
     * Convenience methods
     */
    var getUser = function ($q, $state, UserService, currentUser) {
      if (currentUser && currentUser.id) {
        return UserService.getUser(currentUser.id); // The easy case... currentUser was resolved earlier.

      } else {
        var deferred = $q.defer();
        UserService.getUser().then(function (currentUser) {
          if (currentUser && currentUser.id) {
            return UserService.getUser(currentUser.id);
          } else {
            $state.go('master.nav.landing'); // Dump users without auth to main page.
          }

        }).then(deferred.resolve, deferred.reject);
        return deferred.promise; // The user may be logged in, but hit the page without auth, so currentUser was not resolved on the initial page load.

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
        abstract: true,
        templateUrl: 'views/master.html',
        controller: 'MasterCtrl',
        resolve: {
          currentUser: function (UserService) {
            return UserService.getUser();
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
        controller: 'UserCtrl'
      })
      .state('master.nav.register', {
        url: '/register',
        templateUrl: 'views/register.html',
        controller: 'UserCtrl'
      })
      .state('master.nav.reset', {
        url: '/reset',
        templateUrl: 'views/reset.html',
        controller: 'UserCtrl'
      })
      .state('master.nav.content', {
        url: '/content/:slug'
      })

      /*
       * Authenticated routes
      */
      .state('authenticated', {
        abstract: true,
        templateUrl: 'views/authenticated.html',
        controller: 'AuthenticatedCtrl',
        resolve: {
          user: function ($q, $state, UserService) {
            var deferred = $q.defer();
            UserService.getUser().then(function (currentUser) {
              if (currentUser && currentUser.id) {
                return UserService.getUser(currentUser.id);
              } else {
                $state.go('master.nav.landing'); // Dump users without auth to main page.
              }

            }).then(deferred.resolve, deferred.reject);
            return deferred.promise; // The user may be logged in, but hit the page without auth, so currentUser was not resolved on the initial page load.
          }
        }
      })
      .state('authenticated.master', {
        abstract: true,
        templateUrl: 'views/master.html',
        controller: 'MasterCtrl',
        resolve: {
          currentUser: function (UserService) {
            return UserService.getUser();
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
      .state('authenticated.master.nav.account', {
        url: "/account",
        templateUrl: 'views/account.html',
        controller: 'AccountCtrl'
      })

      /*
       * Admin routes
      */
      .state('authenticated.master.admin', {
        url: '/admin',
        views: {
          nav: {
            templateUrl: 'views/admin-nav.html'
          },
          body: {
            templateUrl: 'views/body.html',
            controller: "AdminCtrl"
          }
        }
      })
      .state('authenticated.master.admin.landing', {
        url: '/landing',
        templateUrl: 'views/admin-landing.html'
      })
      .state('authenticated.master.admin.words', {
        url: '/words',
        templateUrl: 'views/admin-words.html',
        controller: 'WordsCtrl',
        resolve: {
          wordsRef: function (AdminService) {
            return AdminService.getWords();
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
          }
        }
      })
      .state('authenticated.master.admin.files', {
        url: '/files',
        templateUrl: 'views/admin-files.html',
        controller: 'FilesCtrl'
      })
      .state('authenticated.master.admin.social', {
        url: '/social-media',
        templateUrl: 'views/admin-social.html',
        controller: 'SocialCtrl'
      })
      .state('authenticated.master.admin.hashtags', {
        url: '/hashtags',
        templateUrl: 'views/admin-hashtags.html',
        controller: 'HashtagsCtrl'
      });


});