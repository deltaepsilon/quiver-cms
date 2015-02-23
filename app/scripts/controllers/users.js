'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UsersCtrl', function ($scope, messageableRef, AdminService, NotificationService, _) {

    $scope.messageable = messageableRef.$asArray();

    $scope.saveUserRoles = function (user) {
      var serverUser = AdminService.getUser(user.$id).$asObject();

      serverUser.$loaded().then(function () {
        serverUser.private.isAdmin = user.private.isAdmin;
        serverUser.private.isModerator = user.private.isModerator;
        return serverUser.$save();
      }).then(function () {
        NotificationService.success('User saved');
      });

    };

    $scope.saveUserMessageable = function (user) {
      var serverUser = AdminService.getUser(user.$id).$asObject();

      return serverUser.$loaded().then(function () {
        serverUser.messageable = user.messageable || false;
        return serverUser.$save();
      }).then(function () {
        if (serverUser.messageable) {
          return $scope.messageable.$add({
            userKey: serverUser.$id,
            userName: serverUser.userName || false,
            email: serverUser.email
          });
        } else {
          var user = _.findWhere($scope.messageable, {userKey: serverUser.$id});

          return $scope.messageable.$remove(user);
        }
      }).then(function () {
        NotificationService.success('User saved');
      });

    };

  });
