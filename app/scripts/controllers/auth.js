'use strict';

angular.module('quiverCmsApp')
  .controller('AuthCtrl', function ($scope, $state, UserService, NotificationService, AdminService, $localStorage) {
    var parseError = function (err) {
      var parts = err.message.split(':');

      if (parts.length > 1) {
        return parts[1].trim();
      }
      return err;

    }

    $scope.logIn = function (email, password) {
      UserService.logIn(email, password, false).then(function (currentUser) {
        var headers = {"authorization": currentUser.firebaseAuthToken, "user-id": currentUser.id},
          user = UserService.getUser(currentUser.id);

        NotificationService.success('Login Success');
        $scope.setCurrentUser(currentUser);
        $scope.setUser(user);

        AdminService.getApiUser(currentUser.id, headers).then(function () {}, function (err) {
          NotificationService.error('Login Error', err);
        });

        if ($localStorage.redirect) {
          $state.go($localStorage.redirect.toState.name, $localStorage.redirect.toParams);
          delete $localStorage.redirect;
        } else {
          $scope.toLanding();
        }


      }, function (error) {
        NotificationService.error('Login Error', parseError(error));

      });
    };

    $scope.register = function (email, password) {
      UserService.register(email, password).then(function (user) {
        NotificationService.success('Registration Success');
        $scope.forward();

      }, function (error) {
        NotificationService.error('Error', parseError(error));

      });
    };

    $scope.resetPassword = function (email) {
      UserService.resetPassword(email).then(function () {
        NotificationService.success('Password Reset', 'A Password reset email has been sent to ' + email + '.');
        $state.go('master.nav.login');

      }, function (error) {
        NotificationService.error('Error', parseError(error));

      });
    };

    $scope.changePassword = function (email, oldPassword, newPassword) {
      delete $scope.oldPassword;
      delete $scope.newPassword;

      UserService.changePassword(email, oldPassword, newPassword).then(function () {
        NotificationService.success('Password Changed');
      }, function (error) {
        NotificationService.error('Error', parseError(error));
      });
    };


  });
