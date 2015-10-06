'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:FeedbackCtrl
 * @description
 * # FeedbackCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('FeedbackCtrl', function($scope, env, client, assignment, userAssignment, assignmentUploads, assignmentMessages, UserService, AdminService, NotificationService, $mdDialog) {
        /*
         * Client
         */
        client.$bindTo($scope, 'client');

        /*
         * Assignment
         */
        $scope.assignment = assignment;

        /*
         * User Assignment
         */
        userAssignment.$bindTo($scope, 'userAssignment');

        /*
         * Messages
         */
        $scope.messages = assignmentMessages;

        $scope.sendMessage = function(text) {
            var user = $scope.user,
                now = moment(),
                message = {
                    userName: user.name || user.preferredEmail || user.email,
                    assignmentTitle: $scope.assignment.title,
                    text: text,
                    created: now.format(),
                    $priority: now.unix(),
                };

            $scope.messages.$add(message).then(function(ref) {
                message.key = ref.key();
                message.isAdmin = true;
                message.recipientId = client.$ref().key();

                UserService.logMessage(user.public.id, assignment.$ref().key(), 'comment', message);
            });
        };

        /*
         * Uploads
         */
        $scope.uploads = assignmentUploads;

        $scope.openGallery = function(e, image, uploads) {
            $mdDialog.show({
                controller: function($scope, $mdDialog) {
                    var imageRotationIncrement = 90;

                    $scope.cancel = $mdDialog.cancel;
                    $scope.image = image;
                    $scope.uploads = uploads;
                    $scope.selectImage = function(image) {
                        $scope.image = image;
                    };
                    $scope.rotateImage = function (image) {
                        image.rotation = (image.rotation || 0) + imageRotationIncrement;
                        
                        if (image.rotation >= 360) {
                            image.rotation = 0;
                        }
                    };
                },
                templateUrl: "views/uploads-dialog.html",
                targetEvent: e
            });
        };

        // $scope.saveUpload = function (upload) {
        //   $scope.uploads.$save(upload);
        // };

        /*
         * Email Alerts
         */
        $scope.queueFeedbackEmail = function(clientId, userAssignmentKey) {
            AdminService.queueFeedbackEmail(clientId, userAssignmentKey).then(function() {
                NotificationService.success('Email Queued.');
            }, function(err) {
                NotificationService.error('Email Queue Failed', err);
            });
        };

        /*
         * View all user images
         */
         $scope.viewAllUserFiles = function (clientId) {
            $scope.userFiles = UserService.getFiles(clientId);
         };

    });