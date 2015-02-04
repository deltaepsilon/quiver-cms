'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SurveysCtrl
 * @description
 * # SurveysCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SurveysCtrl', function ($scope, surveysRef, moment, _, Slug) {
    $scope.surveys = surveysRef.$asArray();

    $scope.addAnswer = function (answer) {
      var slug = Slug.slugify(answer);

      if (!$scope.newSurvey) {
        $scope.newSurvey = {
          answers: {}
        };
      }

      if (!$scope.newSurvey.answers || typeof $scope.newSurvey.answers !== 'object') {
        $scope.newSurvey.answers = {};
      }

      $scope.newSurvey.answers[slug] = {
        slug: slug,
        text: answer
      };

    };

    $scope.removeAnswer = function (answer) {
      $scope.$apply(function () {
        delete $scope.newSurvey.answers[answer.slug];  
      });
      

    };

    $scope.addSurvey = function (survey) {
      var now = moment();

      _.defaults(survey, {
        $priority: now.unix(),
        slug: Slug.slugify(survey.name),
        active: true,
        created: now.format(),
        unix: now.unix()
      });

      $scope.surveys.$add(survey).then(function () {
        delete $scope.newSurvey;
        delete $scope.newAnswer;
      });

    };

    $scope.removeSurvey = function (survey) {
      $scope.surveys.$remove($scope.surveys.$indexFor(survey.$id));
    };

    $scope.setActive = function (survey, active) {
      $scope.surveys[$scope.surveys.$indexFor(survey.$id)].active = active;
      $scope.surveys.$save($scope.surveys.$indexFor(survey.$id));
    };

    $scope.prioritizeSurvey = function (survey) {
      var surveys = _.sortBy($scope.surveys, function (survey) {
          return -1 * survey.$priority;
        }),
        unix = moment().unix(),
        current,
        currentPriority,
        next,
        nextPriority,
        i = surveys.length;

      while (i--) {
        if (surveys[i].$id === survey.$id) {
          current = surveys[i];
          next = surveys[i - 1];
          break;
        }
      }

      nextPriority = next && next.$priority ? next.$priority : unix;
      currentPriority = current && current.$priority ? current.$priority : nextPriority - 1;
      

      if (next && next.$id) {
        $scope.surveys[$scope.surveys.$indexFor(next.$id)].$priority = currentPriority;
        $scope.surveys.$save($scope.surveys.$indexFor(next.$id));
      }

      if (current && current.$id) {
        $scope.surveys[$scope.surveys.$indexFor(current.$id)].$priority = nextPriority;
        $scope.surveys.$save($scope.surveys.$indexFor(current.$id));
      }
      
      
    }


  });
