'use strict';

angular.module('quiverCmsApp')
  .controller('AccountCtrl', function ($scope, userPublic, userPreferredEmail, userName, qvAuth, NotificationService, CommerceService, moment) {
    userPublic.$bindTo($scope, 'public');

    userPreferredEmail.$bindTo($scope, 'userPreferredEmail');

    userName.$bindTo($scope, 'userName');

    $scope.changePassword = function (email, oldPassword, newPassword) {
      delete $scope.oldPassword;
      delete $scope.newPassword;

      qvAuth.changePassword(email, oldPassword, newPassword).then(function () {
        NotificationService.success('Password Changed');
      }, function (error) {
        NotificationService.error('Error', error.message);
      });
    };

    $scope.$watch('user.public.birthdate', function () {
      if ($scope.user && $scope.user.public && $scope.user.public.birthdate) {
        $scope.birthdate = moment($scope.user.public.birthdate).toDate();
      }

    });

    $scope.setBirthdate = function (birthdate) {
      $scope.public.birthdate = moment(birthdate).format();
    };


    $scope.removePaymentMethod = function (token) {
      if ($scope.$storage.cart && token === $scope.$storage.cart.paymentToken) {
        $scope.$storage.cart.paymentToken = false;
      }

      CommerceService.removePaymentMethod(token).then(function (response) {
        if (response.error) {
          NotificationService.error('Card Error', response.error);
        } else {
          NotificationService.success('Card Removed');
        }
      }, function (err) {
        NotificationService.error('Card Error', err);
      });
    }

  });
