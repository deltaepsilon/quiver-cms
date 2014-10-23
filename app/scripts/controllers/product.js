'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ProductCtrl
 * @description
 * # ProductCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ProductCtrl', function ($scope, productRef, productImagesRef, productOptionGroupsRef, filesRef, hashtagsRef, $localStorage, env, $filter, $timeout, Slug, _) {

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
      if (!$scope.product.description) {
        $scope.product.description = {};
      }

      if (!$scope.product.description.markdown) {
        $scope.product.description.markdown = "### Let's add a [CommonMark](http://commonmark.org) product description!";
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
     * Product Option Groups
    */
    $scope.productOptionGroups = productOptionGroupsRef.$asArray();

    $scope.addOptionGroup = function () {
      $scope.productOptionGroups.$add({
        name: ""
      });
    };

    $scope.removeOptionGroup = function (group) {
      $scope.productOptionGroups.$remove(group);
    };

    $scope.addOption = function (group, optionName) {
      var option = {
        name: optionName,
        slug: Slug.slugify(optionName)
      },
      key = $scope.productOptionGroups.$keyAt(group),
      index = $scope.productOptionGroups.$indexFor(key);

      if (!group.options) {
        group.options = [];
      }

      group.options.push(option);

      $scope.productOptionGroups[index] = group;
      $scope.productOptionGroups.$save(index);

    }

    $scope.removeOption = function (group, option) {
      var key = $scope.productOptionGroups.$keyAt(group),
      index = $scope.productOptionGroups.$indexFor(key),
      i = group.options.length;

      while (i--) {
        if (group.options[i].slug === option.slug) {
          group.options.splice(i, 1);
        }
      }

      $scope.productOptionGroups[index] = group;
      $scope.productOptionGroups.$save(index);

    };

    $scope.saveOption = function (group) {
      var key = $scope.productOptionGroups.$keyAt(group),
      index = $scope.productOptionGroups.$indexFor(key);

      $scope.productOptionGroups[index] = group;
      $scope.productOptionGroups.$save(index);
    }

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

    /*
     * Hashtags
    */
    $scope.hashtags = hashtagsRef.$asArray();

    $scope.addHashtag = function (product, newHashtag) {
      $timeout(function () {
        var hashtag;

        if (!product.hashtags) {
          product.hashtags = [];
        }

        if (typeof newHashtag === 'string') {
          hashtag = newHashtag.replace(/(#|\s)/g, '');
          product.hashtags.push({
            key: Slug.slugify(hashtag),
            value: hashtag
          });
        } else if (newHashtag && newHashtag.key) {
          product.hashtags.push(word.newHashtag);
        }

      });

    };

    $scope.removeHashtag = function (product, slug) {
      var i = product.hashtags.length

      while (i--) {
        if (product.hashtags[i].key === slug) {
          product.hashtags.splice(i, 1);
        }
      }

    };

  });
