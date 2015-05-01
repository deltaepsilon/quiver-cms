'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SurveyCtrl
 * @description
 * # SurveyCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('SurveyCtrl', function($scope, survey, answers, Slug, moment, $mdDialog) {
        /*
         * Survey
         */
        survey.$bindTo($scope, 'survey');

        /*
         * Answers
         */
        $scope.answers = answers;


        $scope.addAnswer = function(answer) {
            $scope.answers.$add({
                $priority: moment().unix(),
                slug: Slug.slugify(answer),
                text: answer
            });

        };

        $scope.removeAnswer = function(index) {
            $scope.answers.$remove(index);

        };

    });