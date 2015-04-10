'use strict';

/**
 * @ngdoc directive
 * @name quiverCmsApp.directive:qvAutoscroll
 * @description
 * # qvAutoscroll
 */
angular.module('quiverCmsApp')
  .directive('qvAutoscroll', function ($uiViewScroll, $timeout) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var scroll = function () {
          $timeout(function () {
            $uiViewScroll(element);  
          });
          
        };

        if (attrs.scrollOn) {
          scope.$on(attrs.scrollOn, scroll);
        } else {
          scroll();
        }
        
        
      }
    };
  });
