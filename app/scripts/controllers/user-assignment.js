'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AssignmentCtrl
 * @description
 * # AssignmentCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UserAssignmentCtrl', function ($scope, $q, $filter, Slug, $stateParams, assignment, userAssignment, userAssignmentUploads, userAssignmentMessages, notifications, user, UserService, NotificationService, moment, env, FileService, $timeout, $interval) {
    /*
     * Assignment
     */
    $scope.assignment = assignment;

    /*
     * User Assignment
     */
    $scope.userAssignment = userAssignment;

    var setSubscriptionKey = function () {
      if (!$scope.userAssignment.subscriptionKey || !$scope.userAssignment.assignmentKey || !$scope.userAssignment.title) {
        $scope.userAssignment.subscriptionKey = $stateParams.subscriptionKey;
        $scope.userAssignment.assignmentKey = $stateParams.assignmentKey;
        $scope.userAssignment.title = assignment.title;
        $scope.userAssignment.$save();
      }
    };

    /*
     * Uploads
     */
    $scope.uploads = userAssignmentUploads;

    /*
     * Messages
     */
    $scope.messages = userAssignmentMessages;

    $scope.sendMessage = function (text) {
      var now = moment(),
        message = {
          userName: user.public.name || user.public.email || user.email,
          assignmentTitle: $scope.assignment.title,
          text: text,
          created: now.format(),
          $priority: now.unix(),
        };

      $scope.messages.$add(message).then(function (ref) {
        setSubscriptionKey();
        message.key = ref.key();
        
        return UserService.logMessage(user.public.id, assignment.$ref().key(), 'comment', message);
      });
    };

    /*
     * Loaded
     */
    $q.all([$scope.uploads.$loaded(), $scope.messages.$loaded()]).then(function () {
      $scope.loaded = true;
    });

    /*
     * Notifications
    */
    $scope.notifications = notifications;

    $scope.getSlug = function (name) {
      var filename = $filter('filename')(name, {'[\\.]': '-'});
      return Slug.slugify(filename);
    };

    $scope.getPercentComplete = function (name) {
      var notification = $scope.notifications[$scope.getSlug(name)];

      return notification ? (notification.loaded / notification.total) / 100 : 0;
    };

    $scope.getNotifications = function (name) {
      return $scope.notifications[$scope.getSlug(name)];
    };

    /*
     * Files
    */
    $scope.uploadTarget = env.api + '/user/' + user.public.id + '/assignment/' + assignment.$ref().key() + '/upload';

    $scope.deleteFlowFile = function (flow, file) {
      var i = flow.files.length;

      while (i--) {
        if (file.name === flow.files[i].file.name) {
          return $scope.$apply(function () {
            flow.files.splice(i, 1);
            NotificationService.success('File Deleted', file.name + ' was deleted.');
          });

        }
      }

      NotificationService.error('Not Found', file.name + ' was not found.');

    };

    // var fakePromises = [];
    // $scope.fakeUpload = function (Flow) {
    //   console.info('Using $scope.fakeUpload. Switch to $scope.upload to make this work for realsies.');

    //   var i = Flow.files.length,
    //     handleInterval = function (j) {
    //       var promise = $interval(function () {
    //         var percent = Flow.files[j].percentComplete;
    //         Flow.files[j].percentComplete = !percent || percent >= 1 ? .1 : percent + .1;
    //       }, 300);
    //       fakePromises.push(promise);
    //     };

    //   if (!fakePromises.length) {
    //     while (i--) {
    //       handleInterval(i);
    //     }
    //   } else {
    //     i = fakePromises.length;
    //     while (i--) {
    //       $interval.cancel(fakePromises[i]);
    //     }
    //   }
      
    // };

    $scope.upload = function (Flow) {
      $scope.uploading = true;

      var promises = [],
        uploadDeferred = $q.defer(),
        clearWatches = function () {
          $q.all(promises).then(function (unwatches) {
            _.each(unwatches, function (unwatch) {
              unwatch();
            });
          });
        },
        i = Flow.files.length,
        file;

      while (i--) {
        file = Flow.files[i];

        var notification = FileService.getNotification($scope.user.$id, $scope.getSlug(file.name)),
          fileDeferred = $q.defer(),
          fileHandler = function (j, fileDeferred) {
            return function () {
              var unwatch = file.notification.$watch(function () {
                if (Flow.files[j].notification) {
                  var percent = Flow.files[j].notification.loaded / Flow.files[j].notification.total;

                  Flow.files[j].percentComplete = isNaN(percent) ? 0 : percent;
                  if (percent === 1) { // The .notification object will get erased at this point, so let's leave the percentComplete at 1 and walk away
                    unwatch();
                  }
                }

              });
              fileDeferred.resolve(unwatch);
            }


          };

        promises.push(fileDeferred.promise);

        file.notification = notification;

        file.notification.$loaded().then(fileHandler(i, fileDeferred));

      }

      var completed = [],
        catchAllHandler = function (e, flowFile, result) {
          switch (e) {
            case 'fileSuccess':
              var file = JSON.parse(result),
                existing = _.findWhere(completed.concat($scope.uploads), {Name: file.Name});

              if (!existing) {
                completed.push(file);
                $scope.uploads.$add(file);
              }
              break;
            case 'complete':
                Flow.off('catchAll', catchAllHandler);
                $scope.uploading = false; // I know I do this twice, but I wouldn't want it to fail for some reason.
                uploadDeferred.resolve(e);              
              break;
            case 'error':
              uploadDeferred.reject(e);
              break;
            default:
              uploadDeferred.notify(e);
              break;
          }
        };

      $q.all(promises).then(function () {
        Flow.upload();
        Flow.on('catchAll', catchAllHandler);

      });

      uploadDeferred.promise.then(function (file) {
        Flow.files = [];
        $scope.uploading = false; // Just in case the earlier pass at reactivating this button failed.
        clearWatches();
        setSubscriptionKey();
        NotificationService.success('Files Processed', 'Your files have successfully been uploaded.');

      }, function (err) {
        console.warn(err);
        Flow.files = [];
        $scope.uploading = false;
        clearWatches();
        NotificationService.error('Upload Error', 'Your file upload failed. ' + err);

      });

    };

    var removeFlowFile = function (filename, flow) {
      var i = flow.files.length,
        handleSplice = function (i) {
          return function () {
            flow.files.splice(i, 1);
          }
          
        };

      while (i--) {
        if (filename === flow.files[i].file.name) {
          return $scope.$apply(handleSplice(i));
        }
      }

    }

    $scope.handleFileAdded = function (e, flow, flowFile) {
      var parts = flowFile.name.split('.'),
        suffix = parts[parts.length - 1],
        supportedImageTypes = env.supportedImageTypes,
        remove = false;

      if (env.maxUploadBytes && flowFile.size > env.maxUploadBytes) {
        remove = true;
        return NotificationService.error('File Too Large', 'Max filesize is ' + parseInt(env.maxUploadBytes/1000000)) + 'MB.'
      } else if (!~supportedImageTypes.indexOf(suffix.toLowerCase())) {
        remove = true;
        NotificationService.error('Unsupported File Type', suffix + ' is an unsupported file type. Suported types include: ' + supportedImageTypes.join(', '));
      }

      if (remove) {
        $timeout(function () {
          removeFlowFile(flowFile.name, flow);
        });
        
      }

    };

    $scope.remove = function (file) {
      UserService.removeUpload($scope.user.public.id, file).then(function () {
        $scope.uploads.$remove(file);
        NotificationService.success('File Removed', 'Removed ' + file.Name);
      }, function (err) {
        NotificationService.error('File Removal Failed', err);
      });

    };


  });
