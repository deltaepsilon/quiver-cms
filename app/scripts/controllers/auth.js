'use strict';

angular.module('quiverCmsApp')
    .controller('AuthCtrl', function($scope, $state, qvAuth, NotificationService, AdminService, $localStorage, moment) {
        var parseError = function(err) {
            var parts = err;

            if (err) {
                if (err.message) {
                    parts = err.message.split(':');                    
                } else if (err.data && err.data.error) {
                    parts = err.data.error;
                }
            }

            if (parts.length > 1) {
                return parts[1].trim();
            } else if (parts.length) {
                return parts[0].trim();
            }

            return err;



        }

        $scope.loaded = true;
        $scope.logIn = function(email, password) {
            $scope.loaded = false;

            qvAuth.logIn(email, password, false).then(function(currentUser) {
                $scope.setCurrentUser(currentUser);
                return AdminService.getApiUser(qvAuth.getHeaders(currentUser)).then(function() {
                    return qvAuth.getUser(currentUser.uid);
                });

            }).then(function(user) {
                $scope.setUser(user);
                $scope.loaded = true;
                NotificationService.success('Login Success');
                $scope.redirect();

            }, function(err) {
                $scope.loaded = true;
                NotificationService.error('Login Error', parseError(err));
            });
        };

        $scope.register = function(email, password) {
            $scope.loaded = false;
            qvAuth.register(email, password).then(function(user) {
                $scope.loaded = true;
                NotificationService.success('Registration Success');
                $scope.logIn(email, password);

            }, function(error) {
                $scope.loaded = true;
                NotificationService.error('Error', parseError(error));

            });
        };

        $scope.resetPassword = function(email) {
            $scope.loaded = false;
            qvAuth.resetPassword(email).then(function() {
                $scope.loaded = true;
                NotificationService.success('Password Reset', 'A Password reset email has been sent to ' + email + '.');
                $state.go('master.nav.login');

            }, function(error) {
                $scope.loaded = true;
                NotificationService.error('Error', parseError(error));

            });
        };

        $scope.changePassword = function(email, oldPassword, newPassword) {
            delete $scope.oldPassword;
            delete $scope.newPassword;

            $scope.loaded = false;
            qvAuth.changePassword(email, oldPassword, newPassword).then(function() {
                $scope.loaded = true;
                NotificationService.success('Password Changed');
            }, function(error) {
                $scope.loaded = true;
                NotificationService.error('Error', parseError(error));
            });
        };

        $scope.google = function() {
            $scope.loaded = false;
            qvAuth.auth.$authWithOAuthPopup('google', {
                scope: 'email'
            }).catch(function() {
                NotificationService.error('Google login failed');
                $scope.loaded = true;
            });

        };

        $scope.facebook = function() {
            $scope.loaded = false;
            qvAuth.auth.$authWithOAuthPopup('facebook', {
                scope: 'email'
            }).catch(function() {
                NotificationService.error('Facebook login failed');
                $scope.loaded = true;
            });

        };

    });