'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ProductCtrl
 * @description
 * # ProductCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ProductCtrl', function ($scope, productRef, productImagesRef, filesRef, $localStorage, env, $filter, $timeout, Slug, _) {

    /*
     * Product
    */
    var product = productRef.$asObject(),
      checkValidity = function () {
        $timeout(function () {
          var product = $scope.product,
            invalidate = function () {
              $scope.product.isValid = false;
            },
            validate = function () {
              $scope.product.isValid = true;
            },
            valid = true;

          if (typeof product.slug !== 'string' || !product.slug.length || typeof product.price !== 'number') {
            valid = false;
          }

          if (valid && product.shipped) {
            if (!product.shipping || typeof product.shipping.domesticPrice !== 'number' || typeof product.shipping.internationalPrice !== 'number' ) {
              valid = false;
            }
          }

          if (valid) {
            switch ($scope.product.type) {
              case 'physical':

                break;

              case 'digital':
                if (typeof product.downloadUri !== 'string' || !product.downloadUri.length) {
                  valid = false;
                }
                break;

              case 'subscription':
                if (typeof product.subscriptionDays !== 'number') {
                  valid = false;
                }
                break;

              case 'gift':
                if (typeof product.discount !== 'number') {
                  valid = false;
                }
                break;
              default:
                valid = false;
                break;
            }

          }

          return valid ? validate() : invalidate();

        });

      };

    $scope.checkValidity = _.debounce(checkValidity, 500);

    product.$bindTo($scope, 'product');

    product.$loaded().then(function () {
      if (!$scope.product.markdown) {
        $scope.product.markdown = "### Let's add some [CommonMark](http://commonmark.org)";
      }

      $scope.$watch('product', checkValidity);
    });

    $scope.slugify = _.debounce(function () {
      $scope.product.slug = Slug.slugify($scope.product.slug);
    }, 500);

    /*
     * Product Images
    */
    $scope.productImages = productImagesRef.$asArray();

    /*
     * localStorage
    */
    $scope.$storage = $localStorage;

    /*
     * Files
    */
    $scope.files = filesRef.$asObject();

    $scope.makeFeaturedImage = function (file) {
      $scope.product.featuredImage = file;
    };

    $scope.removeFromClipboard = function (file) {
      var fileName = $filter('filename')(file.Key);

    };

    $scope.addImage = function (file) {
      $scope.productImages.$add(file);
    };

    $scope.removeImage = function (file) {
      $scope.productImages.$remove(file);
    };

  });
