'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SurveysCtrl
 * @description
 * # SurveysCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('SurveysCtrl', function ($scope, $q, surveysRef, moment, _, Slug, AdminService) {
    $scope.surveys = surveysRef.$asArray();

    $scope.addAnswer = function (answer) {
      if (!$scope.newSurvey) {
        $scope.newSurvey = {
          answers: []
        };
      }

      if (!$scope.newSurvey.answers || !Array.isArray($scope.newSurvey.answers)) {
        $scope.newSurvey.answers = [];
      }

      if (!~$scope.newSurvey.answers.indexOf(answer)) {
        $scope.newSurvey.answers.push(answer);  
      }
      

    };

    $scope.removeAnswer = function (index) {
      $scope.$apply(function () {
        $scope.newSurvey.answers.splice(index, 1);
      });
      

    };

    $scope.addSurvey = function (survey) {
      var now = moment(),
        answers = survey.answers;

      if (survey.answers) {
        delete survey.answers;
      }

      _.defaults(survey, {
        $priority: now.unix(),
        slug: Slug.slugify(survey.name),
        active: true,
        created: now.format(),
        unix: now.unix()
      });

      $scope.surveys.$add(survey).then(function (surveyRef) {
        delete $scope.newSurvey;
        delete $scope.newAnswer;
        return AdminService.getSurveyAnswers(surveyRef.key());
        
      }).then(function (answersRef) {
        var promises = [],
          answersArray = answersRef.$asArray();
        
        _.each(answers, function (answer) {
          promises.push(answersArray.$add({
            $priority: moment().unix(),
            slug: Slug.slugify(answer),
            text: answer
          }));
        });

        return $q.all(promises);
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
