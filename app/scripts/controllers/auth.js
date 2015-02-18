'use strict';

angular.module('quiverCmsApp')
  .controller('AuthCtrl', function ($scope, $state, qvAuth, NotificationService, AdminService, $localStorage, moment) {
    var parseError = function (err) {
      var parts = err.message.split(':');

      if (parts.length > 1) {
        return parts[1].trim();
      }
      return err;

    }

    $scope.logIn = function (email, password) {
      qvAuth.logIn(email, password, false).then(function (currentUser) {
        var headers = {"authorization": currentUser.token, "user-id": currentUser.uid, "email": email},
          user = qvAuth.getUser(currentUser.uid);

        NotificationService.success('Login Success');
        $scope.setCurrentUser(currentUser);
        $scope.setUser(user);

        AdminService.getApiUser(currentUser.uid, headers).then(function (res) {}, function (err) {
          NotificationService.error('Login Error', err);
        });

        $scope.redirect();


      }, function (error) {
        NotificationService.error('Login Error', parseError(error));

      });
    };

    $scope.register = function (email, password) {
      qvAuth.register(email, password).then(function (user) {
        NotificationService.success('Registration Success');
        $scope.logIn(email, password);

      }, function (error) {
        NotificationService.error('Error', parseError(error));

      });
    };

    $scope.resetPassword = function (email) {
      qvAuth.resetPassword(email).then(function () {
        NotificationService.success('Password Reset', 'A Password reset email has been sent to ' + email + '.');
        $state.go('master.nav.login');

      }, function (error) {
        NotificationService.error('Error', parseError(error));

      });
    };

    $scope.changePassword = function (email, oldPassword, newPassword) {
      delete $scope.oldPassword;
      delete $scope.newPassword;

      qvAuth.changePassword(email, oldPassword, newPassword).then(function () {
        NotificationService.success('Password Changed');
      }, function (error) {
        NotificationService.error('Error', parseError(error));
      });
    };

    $scope.google = function () {
      qvAuth.auth.$authWithOAuthPopup('google', {
        scope: 'email'
      });

    };

    $scope.facebook = function () {
      qvAuth.auth.$authWithOAuthPopup('facebook', {
        scope: 'email'
      });

    };

  });
