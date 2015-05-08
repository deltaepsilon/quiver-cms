'use strict';

angular.module('quiverCmsApp')
    .controller('DashboardCtrl', function($scope, assignments, subscriptions, shipments, gifts, downloads, transactions, surveyResponses, UserService, $stateParams, moment, _, NotificationService) {

        /*
         * Objects
         */
        $scope.subscriptions = subscriptions;
        $scope.shipments = shipments;
        $scope.gifts = gifts;
        $scope.downloads = downloads;
        $scope.transactions = transactions;
        $scope.surveyResponses = surveyResponses;

        /*
         * Assignments
         */
        var populateMessages = function(assignments) {
            var i = assignments.length,
                messages = [],
                flatMessages,
                j;

            while (i--) {
                flatMessages = _.toArray(assignments[i].messages);
                j = flatMessages.length;

                while (j--) {
                    flatMessages[j].subscriptionKey = assignments[i].subscriptionKey;
                    flatMessages[j].assignmentKey = assignments[i].assignmentKey;
                    flatMessages[j].title = assignments[i].title;
                    flatMessages[j].moment = moment(flatMessages[j].created);
                    flatMessages[j].unix = flatMessages[j].moment.unix();
                    flatMessages[j].dateAndAssignment = flatMessages[j].moment.format("MM/DD/YYYY") + ": " + flatMessages[j].title;

                }

                messages = messages.concat(flatMessages);

            }

            $scope.groupedMessages = _.groupBy(messages, "dateAndAssignment");

            if (!Object.keys($scope.groupedMessages).length) {
                $scope.groupedMessages = false;
            }

            // var sortedMessages = _.sortBy(messages, function (message) {
            //   return -1 * (message.$priority || moment(message.created).unix());
            // });

            // var laggedDay,
            //   laggedYear,
            //   todaysMessages,
            //   groupedMessages;
            // _.each(sortedMessages, function (message) {
            //   if (message.dayOfYear !== laggedDay && message.year !== laggedYear) {
            //     todaysMessages = 
            //     laggedDay = message.dayOfYear;
            //     laggedYear = message.year;
            //     message.firstOfDay = true;
            //   }
            // });

        };

        $scope.assignments = assignments;

        $scope.assignments.$loaded().then(function(assignments) {
            populateMessages(assignments);
        });

        $scope.$watch('assignments', function() {
            populateMessages($scope.assignments);
        });

        /*
         * Subscription
         */
        $scope.isExpired = function(subscription) {
            return moment().unix() > moment(subscription.expiration).unix();
        };

        /*
         * Survey Responses
         */
        $scope.surveyResponses.$loaded().then(function(surveyResponses) {
            var surveys = $scope.settings.surveys,
                interval = $scope.settings.surveyInterval || 3,
                slugs = _.pluck(surveys, 'slug'),
                i = slugs.length,
                responsesSlugs = _.pluck(surveyResponses, 'slug'),
                survey,
                answeredDates = _.pluck(surveyResponses, 'answered'),
                ignoredDates = _.pluck(surveyResponses, 'ignored'),
                maxAnswered = answeredDates.length ? _.max(answeredDates, function(date) {
                    return date ? moment(date).unix() : 0;
                }) : false,
                maxIgnored = ignoredDates.length ? _.max(ignoredDates, function(date) {
                    return date ? moment(date).unix() : 0;
                }) : false;

            if (maxAnswered && moment().diff(maxAnswered, 'days') < interval) {
                return console.log('No need to ask a survey questions. It has only been ' + moment().diff(maxAnswered, 'days') + ' days since the last survey. The interval is ' + interval + ' days.');
            } else if (maxIgnored && moment().diff(maxIgnored, 'days') < inverval) {
                return console.log('No need to ask a survey questions. It has only been ' + moment().diff(maxIgnored, 'days') + ' days since the last survey was ignored. The interval is ' + interval + ' days.');
            } else {
                while (i--) {
                    if (!~responsesSlugs.indexOf(slugs[i])) {
                        var keys = Object.keys(surveys),
                            j = keys.length;

                        while (j--) {
                            if (surveys[keys[j]].slug === slugs[i]) {
                                survey = surveys[keys[j]];
                                survey.surveyKey = keys[j];
                            }
                        }

                        if (survey.active) {
                            UserService.askedSurvey($scope.user.$id, survey.surveyKey);
                            return $scope.survey = survey;
                        }
                    }
                }
            }

        });

        $scope.saveSurveyResponse = function(survey) {
            survey.answered = moment().format();

            $scope.surveyResponses.$add(survey)
                .then(function() {
                    UserService.logSurvey($scope.user.$id, survey.surveyKey, survey);
                })
                .then(function() {
                    NotificationService.success('Response submitted. Thank you!');
                    delete $scope.survey;
                }, function(error) {
                    NotificationService.error('Survey error.', error);
                });
        };

        $scope.ignoreSurvey = function(survey) {
            survey.ignored = moment().format();

            $scope.surveyResponses.$add(survey).then(function() {
                delete $scope.survey;
            });
        };

    });