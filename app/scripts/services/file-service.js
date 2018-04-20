'use strict';

angular.module('quiverCmsApp')
  .service('FileService', function FileService($q, Restangular, $firebaseObject, env) {
    var service = {
      create: function (file, fileReader, size) {
        var formData = new FormData();

        formData.append('file', fileReader.result);
        formData.append('name', file.name);
        formData.append('type', file.type);
        formData.append('size', size);


        return Restangular.one('admin').all('files').withHttpConfig({transformRequest: angular.identity}).customPOST(formData, file.name, undefined, {'Content-Type': undefined});
      },

      remove: function (key) {
        return Restangular.one('admin').one('files').post('remove', {key: key});
      },

      setMetadata: function (key, metadata) {
        return Restangular.one('admin').one('files', key).post('metadata', metadata);
      },

      uploadFlow: function (Flow) {
        var files = Flow.files,
          i = files.length,
          fileReader,
          deferreds = [],
          deferred,
          handler = function (file, deferred) {
            fileReader.onloadend = function (e) {
              service.create(file, e.target, e.total).then(deferred.resolve, deferred.reject);
            };
          };

        while (i--) {
          deferred = $q.defer();
          deferreds.push(deferred.promise);
          fileReader = new FileReader();
          handler(files[i].file, deferred);
          fileReader.readAsDataURL(files[i].file);

        }

        return $q.all(deferreds);
      },

      getNotification: function (userId, slug) {
        return $firebaseObject(firebase.database().ref(env.firebase.endpoint + '/users/' + userId + '/notifications/' + slug));
      },

      update: function () {
        return Restangular.one('admin').one('files').one('update').get();
      },

      resize: function () {
        return Restangular.one('admin').one('files').one('resize').get();
      }

    };

    return service;
  });
