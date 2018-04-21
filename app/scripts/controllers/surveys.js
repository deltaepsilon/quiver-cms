'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:SurveysCtrl
 * @description
 * # SurveysCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('SurveysCtrl', function($scope, $q, items, moment, _, Slug, AdminService, NotificationService, $mdDialog) {
        $scope.items = items;

        $scope.addAnswer = function(answer) {
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

        $scope.removeAnswer = function(index) {
            $scope.newSurvey.answers.splice(index, 1);
        };

        $scope.addSurvey = function(survey) {
            var now = moment(),
                answers = survey.answers;

            if (survey.answers) {
                delete survey.answers;
            }

            _.defaults(survey, {
                $priority: now.unix(),
                slug: Slug.slugify(survey.name),
                active: true,
                created: now.format()
            });

            $scope.items.$add(survey).then(function(surveyRef) {
                delete $scope.newSurvey;
                delete $scope.newAnswer;
                return AdminService.getSurveyAnswers(surveyRef.key);

            }).then(function(answersArray) {
                var promises = [];

                _.each(answers, function(answer) {
                    promises.push(answersArray.$add({
                        $priority: moment().unix(),
                        slug: Slug.slugify(answer),
                        text: answer
                    }));
                });

                return $q.all(promises);
            });

        };

        $scope.confirmRemoveSurvey = function(e, survey, items) {
            var confirm = $mdDialog.confirm()
                .title(survey.name)
                .content('Are you sure you want to destroy me?')
                .ariaLabel('Delete survey ' + survey.name)
                .ok('Bye bye survey!')
                .cancel("Maybe I'll need you later?")
                .targetEvent(e);

            $mdDialog.show(confirm).then(function() {
                return items.$remove(items.$indexFor(survey.$id));
            }).then(function() {
                NotificationService.success('Survey deleted');
            }, function() {
                NotificationService.notify('Not destroyed!');
            });

        };

        $scope.setActive = function(survey, active) {
            $scope.items[$scope.items.$indexFor(survey.$id)].active = active;
            $scope.items.$save($scope.items.$indexFor(survey.$id));
        };

        $scope.prioritizeSurvey = function(survey) {
            var surveys = _.sortBy($scope.items, function(survey) {
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
                $scope.items[$scope.items.$indexFor(next.$id)].$priority = currentPriority;
                $scope.items.$save($scope.items.$indexFor(next.$id));
            }

            if (current && current.$id) {
                $scope.items[$scope.items.$indexFor(current.$id)].$priority = nextPriority;
                $scope.items.$save($scope.items.$indexFor(current.$id));
            }


        }


    });