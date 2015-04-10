'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.UtilityService
 * @description
 * # utilityService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('UtilityService', function ($q) {
    return {
      getResolvedPromise: function (value) {
        var deferred = $q.defer();
        deferred.resolve(value || true);
        return deferred.promise;
      },

      getRejectedPromise: function (value) {
        var deferred = $q.defer();
        deferred.reject(value || false);
        return deferred.promise;
      }


    }
  });
