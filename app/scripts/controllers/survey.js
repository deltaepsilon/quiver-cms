'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SurveyCtrl
 * @description
 * # SurveyCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SurveyCtrl', function ($scope, surveyRef, Slug) {
    var survey = surveyRef.$asObject();

    survey.$bindTo($scope, 'survey');


    $scope.addAnswer = function (answer) {
      var slug = Slug.slugify(answer);

      if (!$scope.survey) {
        $scope.survey = {
          answers: {}
        };
      }

      if (!$scope.survey.answers || typeof $scope.survey.answers !== 'object') {
        $scope.survey.answers = {};
      }

      $scope.survey.answers[slug] = {
        slug: slug,
        text: answer
      };

    };

    $scope.removeAnswer = function (answer) {
      $scope.$apply(function () {
        delete $scope.survey.answers[answer.slug];  
      });
      

    };

  });
