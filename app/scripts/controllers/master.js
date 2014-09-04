'use strict';

angular.module('quiverCmsApp')
  .controller('MasterCtrl', function ($scope, currentUser, env, UserService, NotificationService, $state, md5) {
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

    $scope.toLanding = toLanding;

    $scope.setCurrentUser = function (currentUser) {
      $scope.currentUser = currentUser;
    };

    $scope.setCurrentUser(currentUser);

    $scope.gravatar = "https://www.gravatar.com/avatar/" + md5.createHash($scope.currentUser.email);



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


  });
