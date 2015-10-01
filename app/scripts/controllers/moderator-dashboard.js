'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ModeratorDashboardCtrl
 * @description
 * # ModeratorDashboardCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ModeratorDashboardCtrl', function($scope, products, _, Slug) {
        /*
         * Affiliate link creator
         */
        $scope.products = products;
        $scope.affiliateLink = {};

        $scope.getOptions = function(affiliateLink) {
            var product = _.findWhere($scope.products, {
                slug: affiliateLink.product
            });
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