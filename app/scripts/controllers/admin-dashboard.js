'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminDashboardCtrl
 * @description
 * # AdminDashboardCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('AdminDashboardCtrl', function($scope, backups, products, AdminService, NotificationService, _, Slug) {
        /*
         * Backup
         */
        $scope.backups = backups;

        $scope.runBackup = function() {
            $scope.runningBackup = true;
            AdminService.runBackup().then(function() {
                NotificationService.success('Backup Run!');
                delete $scope.runningBackup;
                $scope.updateBackups();
            }, function(error) {
                NotificationService.error('Backup Error', error);
                delete $scope.runningBackup;
            });

        };

        $scope.updateBackups = function() {
            $scope.updatingBackups = true;
            AdminService.updateBackups().then(function() {
                NotificationService.success('Backup Updated!');
                delete $scope.updatingBackups;
            }, function(error) {
                NotificationService.error('Backup Update Error', error);
                delete $scope.updatingBackups;
            });

        };

        /*
         * Referral link creator
         */
        $scope.products = products;
        $scope.referralLink = {};

        $scope.getOptions = function (referralLink) {
            var product = _.findWhere($scope.products, {slug: referralLink.product});
            return product ? _.toArray(product.optionsMatrix) : [];
        };

        $scope.getReferralLink = function(referralLink) {
            // https://quiver.is/app/cart?product=my-product-slug&option=my-product-option-slug&code=MYDISCOUNTCODE&referral=http:%2F%2Fmy-referral-string.com&creative=my-ad-name&position=my-ad-position  
            var root = $scope.env.root,
                link = root + '/app/cart',
                parts = [],
                suffix = '',
                parameters = ['product', 'option', 'code', 'referral', 'creative', 'position'];

            if (referralLink) {
                _.each(parameters, function(parameter) {
                    if (referralLink[parameter]) {
                        parts.push(parameter + '=' + Slug.slugify(referralLink[parameter]));
                    }
                });
                if (parts.length) {
                    suffix = '?' + parts.join('&');
                }
            }

            return {
                cart: suffix ? link += suffix : undefined,
                suffix: suffix
            };
        };

    });