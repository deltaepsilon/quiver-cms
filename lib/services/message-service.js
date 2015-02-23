var ObjectService = require('./object-service'),
  ConfigService = require('./config-service'),
  FirebaseService = require('./firebase-service'),
  EmailService = require('./email-service'),
  Utility = require('../extensions/utility'),
  Q = require('q'),
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
          subject: config.subjects.feedbackAlert
        },
        now = moment();

      FirebaseService.authWithSecret(queuedRef).then(function (ref) {
        ref.setWithPriority({
          type: 'feedback',
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
              queuedRef.once('value', function (snap) {
                deferred.resolve(snap.val());
                
              });
              
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

  },

  sendQueuedEmail: function (emailKey) {
    var Services = require('./services'),
      email;

    return ObjectService.getQueuedEmail(emailKey).then(function (emailObj) {
      email = emailObj;
      return EmailService.sendEmail(email.context);
    }).then(function (response) {
      if (email.callback) {
        return Services[email.callback.service][email.callback.method].apply(this, email.callback.arguments);
      } else {
        return Utility.async().fulfilled;
      }
    }).then(function () {
      return EmailService.markQueuedSent(emailKey);
    });
  },

  sendAllQueuedFeedback: function () {
    var deferred = Q.defer(),
      now = moment(),
      getQueue = function () {
        var emailDeferred = Q.defer();
        FirebaseService.getEmailQueue().once('value', function (snap) { 
          emailDeferred.resolve(snap.val());
        });

        return emailDeferred.promise;

      },
      send = function () {
        var promises = [];
        getQueue().then(function (emails) {
          _.each(emails, function (email, key) {
            if (email.type === 'feedback' && !email.sent) {
              promises.push(service.sendQueuedEmail(key));  
            }
            
          });

          Q.all(promises).then(deferred.resolve, deferred.reject);
        });

        
      };

      send();
    

    return deferred.promise;
  },

  send: function (senderId, recipientId, text) {
    var deferred = Q.defer(),
      now = moment(),
      senderPromise = FirebaseService.authWithSecret(FirebaseService.getUser(senderId)).then(FirebaseService.getValue),
      recipientPromise = FirebaseService.authWithSecret(FirebaseService.getUser(recipientId)).then(FirebaseService.getValue);

    Q.all([senderPromise, recipientPromise]).spread(function (sender, recipient) {
      var deferred = Q.defer(),
        message = {
          senderId: senderId,
          recipientId: recipientId,
          text: text,
          type: 'direct',
          unix: now.unix(),
          date: now.format(),
          senderEmail: sender.public.email || sender.email,
          senderName: sender.public.name || sender.public.email || sender.email,
          recipientEmail: recipient.public.email || recipient.email,
          recipientName: recipient.public.name || recipient.public.email || recipient.email
        };

      deferred.resolve(message);
      return deferred.promise;
  
    }).then(function (message) {
      var deferred = Q.defer();

      FirebaseService.getUserMessages(senderId).child('sent').push().setWithPriority(message, now.unix(), function (err) {
        return err ? deferred.reject(err) : deferred.resolve(message);
      });

      return deferred.promise;
    }).then(function (message) {
      var deferred = Q.defer();

      FirebaseService.getUserMessages(recipientId).child('received').push().setWithPriority(message, now.unix(), function (err) {
        return err ? deferred.reject(err) : deferred.resolve(message);
      });

      return deferred.promise;
    }).then(deferred.resolve, deferred.reject);    

    return deferred.promise;
  }

};

return module.exports = service;