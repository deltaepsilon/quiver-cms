'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.FitService
 * @description
 * # FitService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('FitService', function () {
    return  {
      types: [
        {
          name: 'strength',
          description: 'Strength'
        },
        {
          name: 'hiit',
          description: 'HIIT'
        },
        {
          name: 'cardio',
          description: 'Cardio'
        }
      ],
      
      levels: [
        {
          name: 'levelOne',
          description: 'Mild'
        },
        {
          name: 'levelTwo',
          description: 'Spicy'
        },
        {
          name: 'levelThree',
          description: 'Fire Drill'
        }
      ],

      durations: [
        {
          value: 15,
          description: '15 Minutes'
        },
        {
          value: 30,
          description: '30 Minutes'
        },
        {
          value: 45,
          description: '45 Minutes'
        },
        {
          value: 60,
          description: '60 Minutes'
        }
      ],

      circuitTypes: [
        {
          priority: 1,
          name: 'abcd',
          description: 'ABCD'
        },
        {
          priority: 2,
          name: 'abc',
          description: 'ABC'
        },
        {
          priority: 3,
          name: 'ab',
          description: 'AB'
        }
      ],

      video: {
        duration: 30
      }

    };

  });
