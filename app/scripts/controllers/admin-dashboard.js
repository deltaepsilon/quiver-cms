'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AdminDashboardCtrl
 * @description
 * # AdminDashboardCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('AdminDashboardCtrl', function($scope, reports, backups, products, AdminService, NotificationService, _, Slug) {
        /*
         * Reports
         */
        $scope.reports = reports;

        $scope.runReports = function() {
            $scope.runningReports = true;
            AdminService.runReports().then(function() {
                NotificationService.success('Reports Run!');
                delete $scope.runningReports;
                location.reload();
            }, function(error) {
                NotificationService.error('Reports Error', error);
                delete $scope.runningReports;
            });

        };

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
         * Affiliate link creator
         */
        $scope.products = products;
        $scope.affiliateLink = {};

        $scope.getOptions = function (affiliateLink) {
            var product = _.findWhere($scope.products, {slug: affiliateLink.product});
            return product ? _.toArray(product.optionsMatrix) : [];
        };

        $scope.getAffiliateLink = function(affiliateLink) {
            // https://quiver.is/app/cart?product=my-product-slug&option=my-product-option-slug&code=MYDISCOUNTCODE&referral=http:%2F%2Fmy-referral-string.com&creative=my-ad-name&position=my-ad-position  
            var root = $scope.env.root,
                link = root + '/app/cart',
                parts = [],
                parameters = ['product', 'option', 'code', 'referral', 'creative', 'position'];

            if (affiliateLink) {
                _.each(parameters, function(parameter) {
                    if (affiliateLink[parameter]) {
                        parts.push(parameter + '=' + Slug.slugify(affiliateLink[parameter]));
                    }
                });
                if (parts.length) {
                    link += '?' + parts.join('&');
                }
            }

            return link;
        };

    });