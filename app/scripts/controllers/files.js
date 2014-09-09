'use strict';

angular.module('quiverCmsApp')
  .controller('FilesCtrl', function ($scope, FileService, NotificationService, _) {

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

    $scope.upload = function (Flow) {
      FileService.uploadFlow(Flow).then(function () {
        Flow.files = [];
        NotificationService.success('Files Uploaded!')
      });
    };
  });
