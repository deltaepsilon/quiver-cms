'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:DiscountsCtrl
 * @description
 * # DiscountsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('DiscountsCtrl', function ($scope, discountsRef, moment, _, NotificationService) {

    /*
     * Discounts
    */
    $scope.discounts = discountsRef.$asArray();

    var generateCode = function () {
        var possibles = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
          code = "",
          i = 10;

        while (i--) {
          code += possibles.charAt(Math.floor(Math.random() * possibles.length));
        }

        return code;
      },
      getDiscount = function (code) {
        return _.find($scope.discounts, function (discount) {
          return discount.code === code;
        });
      },
      setNewDiscount = function () {
        $scope.newDiscount = {
          type: 'percentage',
          code: generateCode(),
          expiration: moment().add(1, 'year')._d,
          uses: 1,
          minSubtotal: 0,
          active: true
        };
      };
    setNewDiscount();

    var validateDiscount = function (discount) {
      if (!~['percentage', 'value'].indexOf(discount.type)) {
        discount.type = "percentage";
      }

      if (discount.type === 'percentage') {
        discount.percentage = Math.min(Math.max(parseInt(discount.percentage), 0), 100) || 0;
      }

      if (discount.type === 'value') {
        discount.value = Math.max(discount.value, 1) || 0;
      }

      if (!discount.code) {
        discount.code = generateCode();
      }

      if (discount.minSubtotal) {
        discount.minSubtotal = Math.max(discount.minSubtotal, 0);
      }

      if (discount.maxSubtotal) {
        discount.maxSubtotal = Math.max(discount.maxSubtotal, 0);
      }

      if (discount.minSubtotal && discount.maxSubtotal && discount.maxSubtotal < discount.minSubtotal) {
        discount.maxSubtotal = discount.minSubtotal;
      }

      if (getDiscount(discount.code)) {
        NotificationService.error(discount.code + ' already exists.');
        discount.code = generateCode();
        return validateDiscount(discount);
      }

      if (!discount.expiration) {
        discount.expiration = moment().add(1, 'year')._d;
      }

      discount.uses = Math.max(parseInt(discount.uses), 1) || 1;

      return discount;

    };

    $scope.validateNewDiscount = function () {
      $scope.newDiscount = validateDiscount($scope.newDiscount);
    };

    $scope.createDiscount = function (discount) {
      discount = validateDiscount(discount);

      discount.created = moment().format();
      discount.active = true;
      discount.useCount = 0;
      discount.expiration = moment(discount.expiration).format();

      $scope.discounts.$add(discount);
      setNewDiscount();
    };

    $scope.removeDiscount = function (discount) {
      $scope.discounts.$remove(discount);
    };
  });
