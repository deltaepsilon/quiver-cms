'use strict';

angular.module('quiverCmsApp')
  .controller('MasterCtrl', function ($scope, currentUser, env, UserService, ObjectService, NotificationService, $state, md5, settingsRef, filesRef, user, AdminService, _, $localStorage) {
    var loggedOutStates = ['master.nav.login', 'master.nav.register', 'master.nav.reset'],
      toLanding = function () {
        $state.go('master.nav.landing');
      },
      handleStateChange = function (event, toState, fromState, fromParams) {
        if ($scope.currentUser && ~loggedOutStates.indexOf(toState.name)) { //Protect login/register/reset states from logged-in users
          toLanding();
        }
      };

    /*
     * Configure environment and set currentUser
    */
    $scope.environment = env.environment;
    $scope.env = env;

    $scope.toLanding = toLanding;

    $scope.setCurrentUser = function (currentUser) {
      $scope.currentUser = currentUser;

      if (currentUser && currentUser.email) {
        $scope.gravatar = "https://www.gravatar.com/avatar/" + md5.createHash(currentUser.email);
      }

    };

    $scope.setCurrentUser(currentUser);

    /*
     * Settings
    */
    settingsRef.$asObject().$loaded().then(function (settings) {
       $scope.settings = settings;
    });

    /*
     * Files
    */
    $scope.files = filesRef.$asObject();

    /*
     * User
    */

    $scope.setUser = function (user) {
      $scope.user = user;

    };

    $scope.setUser(user);

    /*
     * Storage
    */
    $scope.$storage = $localStorage;

    /*
     * State Body Classes
    */
    $scope.bodyClass = _.reduce([''].concat($state.current.name.split('.')), function (bodyClass, part) {
      return bodyClass + ' state-' + part;
    }).trim();

    /*
     * Handle state changes
    */
    handleStateChange(null, $state.$current);
    $scope.$on('$stateChangeSuccess', handleStateChange);

    /*
     * Forward user to previous state or to landing page if necessary
    */
    $scope.forward = function () {
      if ($state.previous && $state.previous.current.name.length > 0) {
        $state.go($state.previous.current.name, $state.previous.params);
      } else {
        toLanding();
      }

    }

    /*
     * Log out user and forward to landing page
    */
    $scope.logOut = function () {
      UserService.logOut().then(function () {
        delete $scope.currentUser;
        delete $scope.user;
        toLanding();
        NotificationService.success('Logout Success');
      });
    };

    /*
     * Redirect to static site
    */
    $scope.toStatic = function () {
      location.replace('/');
    }

    /*
     * Cache
    */
    $scope.clearCache = function () {
      AdminService.clearCache().then(function () {
        NotificationService.success('Cached Cleared!');
      });
    };



  });
