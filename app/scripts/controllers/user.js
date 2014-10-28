'use strict';

angular.module('quiverCmsApp')
  .controller('UserCtrl', function ($scope, $state, UserService, NotificationService, AdminService) {
    var parseError = function (err) {
      var parts = err.message.split(':');

      if (parts.length > 1) {
        return parts[1].trim();
      }
      return err;

    }

    $scope.logIn = function (email, password) {
      UserService.logIn(email, password).then(function (currentUser) {
        var headers = {"authorization": currentUser.firebaseAuthToken, "user-id": currentUser.id};

        NotificationService.success('Login Success');
        $scope.setCurrentUser(currentUser);

        AdminService.getUser(currentUser.id, headers).then(function () {}, function (err) {
          NotificationService.error('Login Error', err);
        });

        $scope.setUser(UserService.getUser(currentUser.id));
        $scope.toLanding();

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
