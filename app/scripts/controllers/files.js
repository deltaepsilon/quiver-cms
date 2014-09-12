'use strict';

angular.module('quiverCmsApp')
  .controller('FilesCtrl', function ($scope, $q, FileService, NotificationService, filesRef, notificationsRef, $filter, $localStorage, _, ClipboardService, Slug, $interval) {

    /*
     * localStorage
    */
    $scope.$storage = $localStorage;
    if (!$scope.$storage.clipboard) {
      $scope.$storage.clipboard = [];
    }

    /*
     * Notifications
    */
    $scope.notifications = notificationsRef.$asObject();

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
    $scope.files = filesRef.$asObject();

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

//    $scope.fakeUpload = function (Flow) {
//      console.info('Using $scope.fakeUpload. Switch to $scope.upload to make this work for realsies.');
//
//      var i = Flow.files.length,
//        handleInterval = function (j) {
//          $interval(function () {
//            var percent = Flow.files[j].percentComplete;
//            Flow.files[j].percentComplete = !percent || percent >= 1 ? .1 : percent + .1;
//          }, 300)
//        };
//
//      while (i--) {
//        handleInterval(i);
//      }
//    };

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

        var fileRef = FileService.getNotification($scope.currentUser.id, $scope.getSlug(file.name)),
          fileDeferred = $q.defer(),
          fileHandler = function (j, fileDeferred) {
            return function () {
              var unwatch = file.notification.$watch(function () {
                var percent = Flow.files[j].notification.loaded / Flow.files[j].notification.total;
                Flow.files[j].percentComplete = isNaN(percent) ? 0 : percent;
              });
              fileDeferred.resolve(unwatch);
            }


          };

        promises.push(fileDeferred.promise);

        file.notification = fileRef.$asObject();

        file.notification.$loaded().then(fileHandler(i, fileDeferred));

      }

//      return console.warn('returning early for testings');

      $q.all(promises).then(function () {
        return FileService.uploadFlow(Flow);
      }).then(uploadDeferred.resolve, uploadDeferred.reject);

      uploadDeferred.promise.then(function () {
        Flow.files = [];
        $scope.uploading = false;
        NotificationService.success('Files Uploaded!');
        clearWatches();

      }, function (error) {
        $scope.uploading = false;
        NotificationService.error('Upload Failed', error);
        clearWatches();
      });


    };

    $scope.removeFile = function (file) {
      var fileName = $filter('filename')(file.Key);

      $scope.removeFromClipboard(file).then(FileService.remove).then(function () {
        NotificationService.success('File Removed', 'Removed ' + fileName);
      }, function (err) {
        NotificationService.error('File Removal Failed', err);
      });

    };

    /*
     * Clipboard
    */
    $scope.inClipboard = ClipboardService.inClipboard;

    $scope.addToClipboard = function (file) {
      var fileName = $filter('filename')(file.Key);

      if (ClipboardService.add(file)) {
//        return NotificationService.success('+ Clipboard', fileName + ' was added to the clipboard.')
        return fileName;
      } else {
//        return NotificationService.error('Already There!', fileName + ' is already in the clipboard.');
        return false;
      }
    };

    $scope.removeFromClipboard = function (file) {
      var deferred = $q.defer(),
        fileName = $filter('filename')(file.Key);

      $scope.$apply(function () {
        if (ClipboardService.remove(file)) {
//          NotificationService.success('- Clipboard', fileName + ' has been removed from the clipboard.');
          deferred.resolve(fileName);
        } else {
//          NotificationService.error('Not Found', fileName + ' was not found in the clipboard');
          deferred.reject(fileName);
        }
      });

      return deferred.promise;
    };


  });
