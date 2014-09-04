'use strict';

angular.module('quiverCmsApp')
  .controller('UserCtrl', function ($scope, $state, UserService, NotificationService) {

    $scope.logIn = function (email, password) {
      UserService.logIn(email, password, true).then(function (currentUser) {
        NotificationService.success('Login Success');
        $scope.setCurrentUser(currentUser);
        $scope.toLanding();

      }, function (error) {
        console.warn(error);
        NotificationService.error('Error', error);

      });
    };

    $scope.register = function (email, password) {
      UserService.register(email, password).then(function (user) {
        NotificationService.success('Registration Success');
        $scope.forward();

      }, function (error) {
        NotificationService.error('Error', error);

      });
    };

    $scope.resetPassword = function (email) {
      UserService.resetPassword(email).then(function () {
        NotificationService.success('Password Reset', 'A Password reset email has been sent to ' + email + '.');
        $state.go('master.nav.login');

      }, function (error) {
        console.warn(error);
        NotificationService.error('Error', error);

      });
    };

    $scope.changePassword = function (email, oldPassword, newPassword) {
      delete $scope.oldPassword;
      delete $scope.newPassword;

      UserService.changePassword(email, oldPassword, newPassword).then(function () {
        NotificationService.success('Password Changed');
      }, function (error) {
        NotificationService.error('Error', error);
      });
    };


  });
