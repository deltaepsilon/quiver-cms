'use strict';

angular.module('quiverCmsApp')
  .controller('MasterCtrl', function ($scope, currentUser, env, qvAuth, ObjectService, NotificationService, $state, md5, settingsRef, filesRef, user, AdminService, _, $localStorage, $timeout, moment) {
    var loggedOutStates = AdminService.loggedOutStates,
      handleStateChange = function (event, toState, fromState, fromParams) {
        if ($scope.currentUser && ~loggedOutStates.indexOf(toState.name)) { //Protect login/register/reset states from logged-in users
          AdminService.toLanding();
        }
      };

    /*
     * Configure environment and set currentUser
    */
    $scope.environment = env.environment;
    $scope.env = env;

    $scope.toLanding = AdminService.toLanding;
    $scope.redirect = AdminService.redirect;

    $scope.setCurrentUser = function (currentUser) {
      $scope.currentUser = currentUser;

      if (currentUser && currentUser.password) {
        $scope.gravatar = "https://www.gravatar.com/avatar/" + md5.createHash(currentUser.password.email);
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
        $scope.toLanding();
      }

    }

    /*
     * Log out user and forward to landing page
    */
    $scope.logOut = function () {
      qvAuth.logOut().then(function () {
        delete $scope.currentUser;
        delete $scope.user;
        $scope.toLanding();
      });
    };

    var deregister = qvAuth.auth.$onAuth(function (authData) {
      if (!authData && $scope.currentUser) {
        delete $scope.currentUser;
        delete $scope.user;

        NotificationService.notify('Session expired');
        if ($state.toState) {
          $localStorage.redirect = {
            toState: $state.toState,
            toParams: $state.toParams
          };

        }

      }
      
    });

    $scope.$on('$destroy', function () {
      if (typeof deregister === 'function') {
        deregister();      
      }
      
    });

    /*
     * Cache
    */
    $scope.clearCache = function () {
      AdminService.clearCache().then(function () {
        NotificationService.success('Cached Cleared!');
      });
    };

    /*
     * Subscriptions
     */
     $scope.isExpired = function(subscription) {
      return subscription.expiration && moment().unix() > moment(subscription.expiration).unix();
     };



  });
