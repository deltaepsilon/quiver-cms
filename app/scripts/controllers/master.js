'use strict';

angular.module('quiverCmsApp')
  .controller('MasterCtrl', function ($scope, $filter, currentUser, env, qvAuth, ObjectService, NotificationService, $state, md5, settings, user, AdminService, _, $localStorage, $timeout, moment, $mdSidenav, $mdDialog, FirebaseService) {
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
    $scope.bucket = env.amazon.publicBucket;

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
     * Angular Material
     */
    var sidenavs = [],
      registerSidenav = function (menuId) {
        if (!~sidenavs.indexOf(menuId)) {
          sidenavs.push(menuId);
        }
      },
      closeAllSidenavs = function () {
        _.each(sidenavs, function (menuId) {
          $mdSidenav(menuId).close();
        });

      };

    $scope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
      closeAllSidenavs();

    });

    $scope.getSidenav = function (menuId) {
      $mdSidenav(menuId);
    };

    $scope.toggleSidenav = function (menuId) {
      registerSidenav(menuId);
      $mdSidenav(menuId).toggle();
    };

    $scope.openSidenav = function (menuId) {
      registerSidenav(menuId);
      $mdSidenav(menuId).open();
    };

    $scope.closeSidenav = function (menuId) {
      $mdSidenav(menuId).close();
    };

    /*
     * Top Nav
     */
    $scope.showTOC = function () {
      return !!$state.current.name.match(/authenticated\.master\.subscription/);
    };

    $scope.isAdminView = function () {
      return !!$state.current.name.match(/authenticated\.master\.admin/);
    };

    /*
     * Settings
    */
    $scope.settings = settings;
    
    /*
     * Files
    */
    $scope.showGalleryDialog = function (e, file) {
      $mdDialog.show({
        controller: function ($scope, $mdDialog) {
          var bucket = env.amazon.publicBucket,
            imgLink = $filter('s3Link')(file.Version && file.Versions.small ? file.Versions.small.Key : file.Key, bucket);

          $scope.file = file;
          $scope.imgLink = $filter('forceImage')(imgLink);
          $scope.fileLink = $filter('s3Link')(file.Key, bucket);
          $scope.mdLink = "[" + file.Name + "](" + $scope.fileLink + ")";
          
          $scope.cancel = $mdDialog.cancel;
        },
        templateUrl: "views/gallery-dialog.html",
        targetEvent: e
      });
    };

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

    };

    /*
     * Reload state. Forces evaluation of auth.
     */
    $scope.reload = function () {
      $state.go($state.current, $state.params, {reload: true});
    };

    /*
     * Log out user and forward to landing page
    */
    $scope.logOut = function () {
      FirebaseService.destroySecureRefs()
        .then(qvAuth.logOut)
        .then(function () {
          delete $scope.currentUser;
          delete $scope.user;
          $scope.closeSidenav('left');
          NotificationService.success('Log Out Success');
          $scope.reload();
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
      return !!subscription && subscription.expiration && moment().unix() > moment(subscription.expiration).unix();
     };



  });
