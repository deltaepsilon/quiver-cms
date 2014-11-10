'use strict';

/**
 * @ngdoc directive
 * @name quiverCmsApp.directive:braintreeDropIn
 * @description
 * # braintreeDropIn
 */
angular.module('quiverCmsApp')
  .directive('braintreeDropIn', function () {
    return {
      template: '<form id="checkout" name="braintreeDropIn"><div id="dropin"></div><button class="small small-12 text-x-medium-important margin-zero-important">Add Payment Method</button></form>',
      restrict: 'EA',
      link: function postLink(scope, element, attrs) {
        element.text('this is the braintreeDropIn directive');
      }
    };
  });
