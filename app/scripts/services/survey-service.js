'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.SurveyService
 * @description
 * # SurveyService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('SurveyService', function ($q, qvAuth, AdminService, UserService, Restangular, moment, Slug) {
    return {
      getSurvey: function (userId) {
        var surveys = AdminService.getSurveys().$asArray(),
          surveyLog = UserService.getSurveyLog(userId).$asArray();

        return $q.all([surveys.$loaded(), surveyLog.$loaded()]).then(function () {
          // Find the highest priority survey that has not been answered in the last month
          var deferred = $q.defer(),
            getLatestResponse = function (surveySlug) {
              var responses = _.where(surveyLog, {survey: surveySlug}),
                sorted = _.sortBy(responses, function (response) {
                  return -1 * response.unix;
                });
              return sorted && sorted.length ? sorted[0] : false;

            },
            prioritizedSurveys = _.sortBy(surveys, function (survey) {
              var latestResponse = getLatestResponse(survey.slug);
              return latestResponse && latestResponse.$priority ? latestResponse.$priority : -1 * survey.$priority;

            });

           if (prioritizedSurveys && prioritizedSurveys.length) {
            Restangular.one('survey').one('asked').post(prioritizedSurveys[0].slug).then(function () {
              deferred.resolve(prioritizedSurveys[0]);  
            });

           } else {
            deferred.reject();
           }
           return deferred.promise;

        });

      },

      setResponse: function (userId, surveySlug, response) {

        return UserService.getSurveyLog(userId).$asArray().$loaded().then(function (surveyLog) {
          var now = moment(),
          unix = now.unix(),
          responseWindow = 60 * 60 * 12, // 12-hour response window
          responses = _.where(surveyLog, {survey: surveySlug}),
          recent = _.find(responses, function (existingResponse) {
            return unix - existingResponse.unix < responseWindow;

          }); 

          if (recent && !response) {
            return surveyLog.$remove(recent);

          } else if (recent && response) {
            recent.slug = response.slug || Slug.slugify(response.text);
            recent.text = response.text;
            recent.date = now.format();
            recent.unix = unix;
            recent.$priority = unix;
            return surveyLog.$save(recent);

          } else {
            return surveyLog.$add({
              $priority: unix,
              slug: response.slug || Slug.slugify(response.text),
              text: response.text,
              survey: surveySlug,
              unix: unix,
              date: now.format()
            }).then(function () {
              return Restangular.one('survey').one('answered').post(surveySlug);

            });

          }

        });

        

      
      }

    };
  });
