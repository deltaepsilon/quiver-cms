'use strict';

/**
 * @ngdoc directive
 * @name quiverCmsApp.directive:qvList
 * @description
 * # qvList
 */
angular.module('quiverCmsApp')
  .directive('qvList', function ($controller, $q, $stateParams, moment, _) {
    return {
      transclude: true,
      restrict: 'A',
      scope: {
        ref: '=',
        getRef: '=',
        limit: '='
      },
      link: function postLink(scope, element, attrs, ctrl, transclude) {
        scope.limit = parseInt(scope.limit) || 10;

        if (attrs.locals) {
          _.extend(scope, scope.$parent.$eval(attrs.locals));
        }
        
        transclude(scope, function (clone, scope) {
          element.append(clone);
        });

        $controller('ListCtrl', {
          $scope: scope,
          $q: $q,
          $stateParams: $stateParams,
          moment: moment,
          ref: scope.ref, 
          getRef: scope.getRef, 
          limit: scope.limit
        });

      }
    };
  });
