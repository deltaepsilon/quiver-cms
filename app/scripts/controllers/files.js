'use strict';

angular.module('quiverCmsApp')
  .controller('FilesCtrl', function ($scope, $q, FileService, NotificationService, originalsRef, bucket, notificationsRef, $filter, $localStorage, _, ClipboardService, Slug, env, $interval, limit, AdminService, $stateParams) {

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
     * Originals
     */
    var originals = originalsRef.$asArray();
    $scope.originals = originals;

    /*
     * Bucket
     */
    $scope.bucket = bucket.$value;

    /*
     * Query
     */
    var query = function (q) {
      var q = q || {orderByPriority: true, limitToLast: $scope.limit};

      originalsRef = AdminService.getOriginals(q);
      originals = originalsRef.$asArray();
      originals.$loaded().then(function (originals) {
        $scope.originals = originals;
      });
    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);

      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.search = function (term) {
      $scope.searching = true;
      query({orderByPriority: true, orderByChild: 'Name', startAt: term});
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };

    originals.$loaded().then(function () {
      if ($stateParams.search) {
        var term = $stateParams.search;
        $scope.searchTerm = term;
        $scope.search(term);
      }
      
    });

    /*
     * Files
    */
    $scope.uploadTarget = env.api + '/admin/files';

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

    var fakePromises = [];
    $scope.fakeUpload = function (Flow) {
      console.info('Using $scope.fakeUpload. Switch to $scope.upload to make this work for realsies.');

      var i = Flow.files.length,
        handleInterval = function (j) {
          var promise = $interval(function () {
            var percent = Flow.files[j].percentComplete;
            Flow.files[j].percentComplete = !percent || percent >= 1 ? .1 : percent + .1;
          }, 300);
          fakePromises.push(promise);
        };

      if (!fakePromises.length) {
        while (i--) {
          handleInterval(i);
        }
      } else {
        i = fakePromises.length;
        while (i--) {
          $interval.cancel(fakePromises[i]);
        }
      }
      
    };

    $scope.upload = function (Flow) {
      $scope.uploading = true;

      var promises = [],
        uploadDeferred = $q.defer(),
        resizeDeferred = $q.defer(),
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

        var fileRef = FileService.getNotification($scope.currentUser.uid, $scope.getSlug(file.name)),
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

        file.notification = fileRef.$asObject();

        file.notification.$loaded().then(fileHandler(i, fileDeferred));

      }

      $q.all(promises).then(function () {
        var deferred = $q.defer(),
          catchAllHandler = function (e) {
            switch (e) {
              case 'complete':
                $scope.uploading = false; // I know I do this twice, but I wouldn't want it to fail for some reason.
                deferred.resolve(e);
                break;
              case 'error':
                deferred.reject(e);
                break;
              default:
                deferred.notify(e);
                break;
            }
          };

        Flow.upload();
        Flow.on('catchAll', catchAllHandler);

        return deferred.promise;

      }).then(uploadDeferred.resolve, uploadDeferred.reject);

      uploadDeferred.promise.then(function () {
        $scope.resizing = true;
        return FileService.resize();
      }).then(resizeDeferred.resolve, resizeDeferred.reject);

      resizeDeferred.promise.then(function () {
        Flow.files = [];
        $scope.uploading = false; // Just in case the earlier pass at reactivating this button failed.
        $scope.resizing = false;
        clearWatches();
        $scope.reset();
        NotificationService.success('Images Processed', 'Your images have successfully been resized.');

      }, function (err) {
        Flow.files = [];
        $scope.uploading = false;
        $scope.resizing = false;
        clearWatches();
        NotificationService.error('Resize Error', 'Your images have resize failed. ' + err);
        console.warn(err);

      });

    };

    $scope.removeFile = function (file) {
      var parts = file.Key.split("/"),
      fileName;

      parts.shift();
      fileName = parts.join("|");

      if ($scope.inClipboard(file)) {
        $scope.removeFromClipboard(file);
      }

      FileService.remove(fileName || $filter('filename')(file.Key)).then(function () {
        NotificationService.success('File Removed', 'Removed ' + fileName);
      }, function (err) {
        NotificationService.error('File Removal Failed', err);
      });

    };

    $scope.resize = function () {
      var deferred = $q.defer();

      $scope.resizing = true;

      FileService.resize().then(function () {
        NotificationService.success('Images Processed', 'Your images have successfully been resized and the file registry has been updated.');
        delete $scope.resizing;
        $scope.reset();
        deferred.resolve();
      }, function (err) {
        NotificationService.error('Resize Failed', err);
        delete $scope.resizing;
        deferred.reject(err);
      });

      return deferred.promise;

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
