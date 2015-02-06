'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SurveyCtrl
 * @description
 * # SurveyCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SurveyCtrl', function ($scope, surveyRef, answersRef, Slug, moment) {
    /*
     * Survey
     */
    var survey = surveyRef.$asObject();

    survey.$bindTo($scope, 'survey');

    /*
     * Answers
     */
    var answers = answersRef.$asArray();
    $scope.answers = answers;


    $scope.addAnswer = function (answer) {
      $scope.answers.$add({
        $priority: moment().unix(),
        slug: Slug.slugify(answer),
        text: answer
      });

    };

    $scope.removeAnswer = function (index) {
      $scope.answers.$remove(index);     

    };

  });
