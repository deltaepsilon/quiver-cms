'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.firebaseService
 * @description
 * # firebaseService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('FirebaseService', function ($q, $timeout) {
    var secureRefs = [];

    return {
      query: function (ref, query) {
        if (!query) {
          return ref;
        }

        // return ref.limitToFirst(query.limitToFirst);

        // Respect only one orderBy* option
        if (query.orderByChild) {
          ref = ref.orderByChild(query.orderByChild);
        } else if (query.orderByKey) {
          ref = ref.orderByKey();
        } else if (query.orderByPriority) {
          ref = ref.orderByPriority();
        }

        // Respect only one limitTo* option
        if (query.limitToFirst) {
          ref = ref.limitToFirst(query.limitToFirst);
        } else if (query.limitToLast) {
          ref = ref.limitToLast(query.limitToLast);
        }

        // Respect equalTo or one or both *At query
        if (typeof query.equalTo !== 'undefined') {
          ref = ref.equalTo(query.equalTo);
        } else {
          if (typeof query.startAt !== 'undefined') {
            ref = ref.startAt(query.startAt);
          } 
          if (typeof query.endAt !== 'undefined') {
            ref = ref.endAt(query.endAt);
          }

        }

        return ref;
        
      },

      registerSecureRef: function (ref) {
        secureRefs.push(ref);
        return ref;
      },

      destroySecureRefs: function () {
        var deferred = $q.defer(),
          i = secureRefs.length;

        while (i--) {
          if (typeof secureRefs[i].$destroy === 'function') {
            secureRefs[i].$destroy();
          }
        }

        secureRefs = [];

        $timeout(deferred.resolve);

        return deferred.promise;

      }

    };
  });
