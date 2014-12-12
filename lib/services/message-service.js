var ObjectService = require('./object-service'),
  ConfigService = require('./config-service'),
  FirebaseService = require('./firebase-service'),
  request = require('superagent'),
  moment = require('moment'),
  _ = require('underscore'),
  Q = require('q');

var service = {
  queueFeedbackEmail: function (userId, assignmentKey) {
    var deferred = Q.defer(),
      textDeferred = Q.defer(),
      htmlDeferred = Q.defer(),
      path = ConfigService.get('public.root') + '/user/' + userId + '/assignment/' + assignmentKey + '/feedback-email';

    request.get(path + '/text').end(function (err, res) {
      return err ? textDeferred.reject(err) : textDeferred.resolve(res.text);
    });

    request.get(path + '/html').end(function (err, res) {
      var content = res.text;
      return err ? htmlDeferred.reject(err) : htmlDeferred.resolve(content);
    });

    Q.all([ObjectService.getUser(userId), textDeferred.promise, htmlDeferred.promise]).spread(function (user, text, html) {
      var assignmentMessagesRef = FirebaseService.getUserAssignmentMessages(userId, assignmentKey),
        queuedRef = FirebaseService.getEmailQueue().push(),
        config = ConfigService.get('private.email'),
        context = {
          text: text,
          html: html,
          to: [{
            "email": user.public.email || user.email,
            "name": user.public.name || user.public.email || user.email,
            "type": "to"
          }],
          tags: ['feedback-alert'],
          subject: config.subjects.feedbackAlert
        },
        now = moment();

      FirebaseService.authWithSecret(queuedRef).then(function (ref) {
        ref.setWithPriority({
          created: now.format(),
          context: context,
          callback: {
            service: 'MessageService',
            method: 'updateUserAssignmentMessages',
            arguments: [userId, assignmentKey, 'alerted']
          }
        }, 
        now.unix(), 
        function (err) {
          if (err) {
            deferred.reject(err);
          } else {
            service.updateUserAssignmentMessages(userId, assignmentKey, 'queued').then(function (messages) {
              deferred.resolve(queuedRef.val());
            });
          }
          
        });
        
      });

    });

    return deferred.promise;
  },

  updateUserAssignmentMessages: function (userId, assignmentKey, attribute) {
    var messagesRef = FirebaseService.getUserAssignmentMessages(userId, assignmentKey),
      deferred = Q.defer(),
      promises = [];

    messagesRef.once('value', function (snap) {
      var messages = snap.val(),
        keys = Object.keys(messages),
        now = moment().format(),
        saveMessage = function (messageKey, deferred) {
          messagesRef.child(messageKey).child(attribute).set(now, function (err) {
            return err ? deferred.reject(err) : deferred.resolve();
          });
        };
      
      _.each(keys, function (messageKey) {
        var saveDeferred = Q.defer();
        promises.push(saveDeferred.promise);

        saveMessage(messageKey, saveDeferred);
      });

      Q.all(promises).then(function () {
        messagesRef.once('value', function (snap) {
          deferred.resolve(snap.val());
        });

      }, function (err) {
        deferred.reject(err);
      });

    });

    return deferred.promise;

  }
};

return module.exports = service;