var fs = require('fs'),
	formidable = require('formidable'),
	LogService = require('../services/log-service'),
  slug = require('slug'),
  Q = require('q'),
  _ = require('underscore'),
	chunks = [];

module.exports = {
	body: function (req, res, next) {
    var form = new formidable.IncomingForm();

    form.uploadDir = './uploads';
    form.keepExtensions = true;
    form.maxFieldSize = 100 * 1024;

//    form.on('file', function (name, file) {
//      console.log('file', name);
//      LogService.log('file');
//    });
//
//    form.on('progress', function (bytesReceived, bytesExpected) {
//      console.log('progress', bytesReceived, bytesExpected);
//      LogService.log('progress');
//    });
//
//    form.on('aborted', function () {
//      console.log('aborted');
//      LogService.log('aborted');
//    });
//
//    form.on('end', function () {
//      console.log('end');
//      LogService.log('end');
//    });

    form.on('error', function (err) {
      LogService.error(err);
    });

    form.parse(req, function (err, fields, files) {
      req.body = fields;
      req.files = files;
      next();
    });
	},

	flow: function (req, res, next) {
		var form = new formidable.IncomingForm();

    form.uploadDir = './uploads';
    form.keepExtensions = true;
    form.maxFieldSize = 100 * 1024;

    form.on('error', function (err) {
      LogService.error(err);
    });

    form.parse(req, function (err, fields, files) {
      //    console.log('parse', err, fields, files);
      var flowFilename = fields.flowFilename,
        flowChunkNumber = parseInt(fields.flowChunkNumber),
        flowTotalChunks = parseInt(fields.flowTotalChunks),
        clearChunks = function (fileName) {
          var deferred = Q.defer(),
            promises = [];

          _.each(_.where(chunks, {flowFilename: fileName}), function (chunk) {
            var chunkDeferred = Q.defer();
            promises.push(chunkDeferred.promise);

            fs.unlink(chunk.file.path, function (err) {
              return err ? chunkDeferred.reject(err) : chunkDeferred.resolve();
            });

          });

          Q.all(promises).then(function () {
            var i = chunks.length;

            while (i--) {
              if (chunks[i].flowFilename === fileName) {
                chunks.splice(i, 1);
              }
            }

            deferred.resolve();

          }, deferred.reject);

          return deferred.promise;
        },
        concatDeferred = Q.defer(),
        concatNextChunk = function (i) {
          var i = i || 1,
            chunk = _.findWhere(chunks, {flowFilename: flowFilename, flowChunkNumber: i.toString()}),
            readDeferred = Q.defer(),
            writeDeferred = Q.defer();

//          console.log('reading', i, chunk.file.path);
          fs.readFile(chunk.file.path, function (err, data) {
            return err ? readDeferred.reject(err) : readDeferred.resolve(data);
          });

          readDeferred.promise.then(function (data) {
//            console.log('appending', i, flowTotalChunks, form.uploadDir + '/' + flowFilename);
            fs.appendFile(form.uploadDir + '/' + flowFilename.toLowerCase(), data, function (err) {
              return err ? writeDeferred.reject(err) : writeDeferred.resolve();
            });
          });

          Q.all([readDeferred.promise, writeDeferred.promise]).spread(function () {
            return (i === flowTotalChunks) ? concatDeferred.resolve(chunk) : concatNextChunk(i + 1);

          }, concatDeferred.reject);

          return concatDeferred.promise;
        };

      fields.file = files.file;

      chunks.push(fields);

      if (flowChunkNumber === flowTotalChunks) {
        concatNextChunk().then(function (chunk) {
          req.body = chunk;
          req.body.fileName = flowFilename;
          clearChunks(flowFilename).then(next);
        }, function (err) {
          LogService.error(err);
          clearChunks(flowFilename).then(function () {
            res.sendStatus(500);
          });
        });
      } else {

        if ( flowChunkNumber % 5 === 0 ) { // Set notification on every fifth chunk
          var notificationsRef = req.userRef.child('notifications').child(slug(flowFilename, {charmap: {'.': '-', '&': 'and'}}).toLowerCase());
          notificationsRef.set({
            loaded: flowChunkNumber / 3, // This is roughly the first third of the process, so divide the completion percentage by 3
            total: flowTotalChunks
          });

        }

        res.sendStatus(200);
      }

    });
	}
};