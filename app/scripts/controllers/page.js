'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('PageCtrl', function($scope, $rootScope, $stateParams, word, pages) {
        /*
         * Word
         */
        $scope.word = word;

        $scope.word.$loaded().then(function () {
            setTimeout(function () {
                if (Prism && typeof Prism.highlightAll === 'function') {
                    Prism.highlightAll();
                }
            });
        });

        /*
         * Pages
         */
        $scope.pages = pages;

        $scope.pageNumber = parseInt($stateParams.pageNumber);

        $scope.prevPageNumber = $scope.pageNumber - 1;
        $scope.prev = pages[$scope.prevPageNumber];

        $scope.nextPageNumber = $scope.pageNumber + 1;
        $scope.next = pages[$scope.nextPageNumber];

        /*
         * Subscription
         */
        $scope.subscriptionKey = $stateParams.subscriptionKey;

    });