'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.LocationService
 * @description
 * # LocationService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('LocationService', function LocationService($http) {
    return {
      getLocations: function (location) {
        return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                  address: location,
                  sensor: false
                }
              }).then(function(response){
                return response.data.results.map(function(item){
                  return {
                    key: item.geometry.location,
                    value: item.formatted_address,
                    address: item.formatted_address
                  }
              });
          });
      }
    }
  });
