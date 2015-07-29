'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:HeadCtrl
 * @description
 * # HeadCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('HeadCtrl', function($scope, $rootScope, $state, env, AdminService) {
        var titlesMap = {
                'master.nav.login': 'Login',
                'master.nav.register': 'Register',
                'master.nav.reset': 'Password Reset',
                'master.nav.cart': 'Cart',
                'authenticated.master.nav.dashboard': 'Dashboard',
                'authenticated.master.nav.account': 'Account',
                'authenticated.master.nav.checkout': 'Checkout',
                'authenticated.master.nav.transaction': 'Transaction',
                'authenticated.master.nav.messages.list': 'Messages',
                'authenticated.master.subscription.page': 'Page',
                'authenticated.master.subscription.assignment': 'Assignment',
                'authenticated.master.nav.find-assignment': 'Find Assignment',
                'authenticated.master.nav.archivedGallery': 'Archived Gallery'
            },
            siteTitle = 'Quiver CMS';

        AdminService.getSettings().$loaded().then(function (settings) {
           siteTitle = settings.siteTitle; 
        });

        $rootScope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState, fromParams) {
            var stateName = $state.current.name,
                parts = stateName.split('.'),
                title;

            if (titlesMap[stateName]) {
                title = titlesMap[stateName] + ' | ';
            } else if (~parts.indexOf('admin')) {
                title = 'Admin | ';
            } else if (~parts.indexOf('moderator')) {
                title = 'Moderator | ';
            }

            title += siteTitle;

            $scope.title = title;
        });

        $scope.title = siteTitle;
    });