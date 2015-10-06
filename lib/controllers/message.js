var FirebaseService = require('../services/firebase-service'),
    ConfigService = require('../services/config-service'),
    ObjectService = require('../services/object-service'),
    LogService = require('../services/log-service'),
    FileService = require('../services/file-service'),
    MessageService = require('../services/message-service'),
    AWSService = require('../services/aws-service'),
    AWS = AWSService.AWS,
    S3 = new AWS.S3(),
    fs = require('fs-extra'),
    Q = require('q'),
    slug = require('slug'),
    moment = require('moment'),
    _ = require('underscore'),
    request = require('superagent'),
    publicBucket = ConfigService.get('public.amazon.publicBucket'),
    fileUserPrefix = (ConfigService.get('private.amazon.filePrefix') || 'cms') + '/user',
    errorHandler = function(res, err) {
        LogService.error('message', err);
        res.status(500).send(err);
    };

return module.exports = {
    log: function(req, res) {
        var user = req.user,
            userId = req.params.userId,
            assignmentKey = req.params.assignmentKey,
            type = req.params.type,
            messagesRef = FirebaseService.getMessages(),
            now = moment(),
            unix = now.unix(),
            message = {
                created: now.format(),
                assignmentKey: assignmentKey,
                type: type,
                userEmail: user.email,
                userName: user.name || user.preferredEmail || user.email,
                userId: userId,
                keys: {}
            },
            userDeferred = Q.defer(),
            moderatorDeferred = Q.defer();

        _.defaults(message, req.body);

        if (message.$priority) {
            delete message.$priority;
        }

        FirebaseService.authWithSecret(messagesRef).then(function(ref) {
            var logRef = ref.push(),
                moderatorLogRef;

            message.keys.log = logRef.key();

            if (assignmentKey && !user.isModerator) { // Don't duplicate moderator comments in the moderator logs
                moderatorLogRef = FirebaseService.getModeratorMessages(assignmentKey).push();
                message.keys.moderator = moderatorLogRef.key();
            }

            logRef.set(message, function(err) {
                if (err) {
                    return userDeferred.reject(err);
                } else {
                    if (message.recipientId && message.recipientId !== userId) { // Handle case where there is a recipient
                        FirebaseService.getUserMessages(message.recipientId).push(message, function(err) {
                            return err ? userDeferred.reject(err) : userDeferred.resolve(message);
                        });
                    } else {
                        userDeferred.resolve(message);
                    }

                    if (moderatorLogRef) {
                        moderatorLogRef.set(message, function(err) {
                            return err ? moderatorDeferred.reject(err) : moderatorDeferred.resolve(message);
                        });
                    } else {
                        moderatorDeferred.resolve(message);
                    }

                }

            });

        });

        Q.all([userDeferred.promise, moderatorDeferred.promise]).spread(function(message) {
            return res.json(message);
        }, function(err) {
            return res.status(500).send(err);
        });

    },

    upload: function(req, res) {
        /*
         * Configure AWS.S3 payload from request
         */
        var userId = req.params.userId,
            assignmentKey = req.params.assignmentKey,
            assignmentTitle = req.body.assignmentTitle,
            fileName = req.body.fileName.toLowerCase(),
            parts = fileName.split('.'),
            suffix = parts[parts.length - 1],
            filePath = req.body.uploadDir + '/' + fileName,
            readDeferred = Q.defer(),
            fileDeferred = Q.defer(),
            mimeType,
            ETag;

        // Calculate mime types
        if (~ConfigService.get('public.supportedImageTypes').indexOf(suffix)) {
            mimeType = 'image';
        } else if (~ConfigService.get('public.supportedVideoTypes').indexOf(suffix)) {
            mimeType = 'video';
        } else {
            mimeType = 'application';
        }
        mimeType += '/' + suffix;

        if (!fileName) {
            return errorHandler(res, {
                "error": "No file sent."
            });
        }

        fs.readFile(filePath, {
            encoding: "base64"
        }, function(err, data) {
            return err ? readDeferred.reject(err) : readDeferred.resolve(data);
        });

        readDeferred.promise.then(function() {
            fs.unlink(filePath, function(err) {
                return err ? console.log(err) : true;
            });
        });

        /*
         * Handle s3 upload
         */
        readDeferred.promise.then(function(data) {
            var file = new Buffer(data, "base64"),
                payload = {
                    Bucket: publicBucket,
                    Key: fileUserPrefix + '/' + userId + '/' + fileName.replace(/:/g, "/"), // Filenames with forward slashes in them get copied to the filesystem with ":" instead of the slashes.
                    ACL: 'public-read',
                    Body: file,
                    CacheControl: "max-age=34536000",
                    Expires: moment().add(5, 'year').unix(),
                    ContentType: mimeType,
                    StorageClass: "REDUCED_REDUNDANCY"
                };

            // console.log('key', payload.Key);

            /*
             * Upload file
             * Report progress
             */
            var notificationsRef = req.userRef.child('notifications').child(slug(fileName, {
                charmap: {
                    '.': '-'
                }
            }).toLowerCase());

            var s3request = S3.putObject(payload, function(err, data) {
                if (err) {
                    fileDeferred.reject(err);
                } else {
                    ETag = data.ETag;
                    notificationsRef.remove();
                    fileDeferred.resolve(data);
                }

            });

            s3request.on('httpUploadProgress', function(progress) {
                progress.loaded = 2 / 3 * progress.loaded + 1 / 3 * progress.total; // Inflate the loaded value by 33%, because this part of the process is the second two thirds of the upload.
                notificationsRef.set(progress);
            });
        }, function(err) {
            errorHandler(res, err)
        });

        /*
         * Handle file upload results
         */
        fileDeferred.promise.then(function() {
            return FileService.updateUserFilesRegister(userId);
        }).then(function(s3Data) {
            var deferred = Q.defer(),
                upload = _.findWhere(s3Data.Contents, {
                    ETag: ETag
                }),
                uploadsRef = FirebaseService.getUploads(),
                record;

            upload.LastModified = moment(upload.LastModified).format();

            record = {
                created: moment().format(),
                userId: userId,
                userEmail: req.user.email,
                assignmentKey: assignmentKey,
                assignmentTitle: assignmentTitle,
                upload: upload,
                keys: {}
            };

            FirebaseService.authWithSecret(uploadsRef).then(function(ref) {
                var uploadRef = ref.push();

                record.keys.log = uploadRef.key();

                uploadRef.set(record, function(err) {
                    return err ? deferred.reject(err) : deferred.resolve(record);
                });
            });

            return deferred.promise;
        }).then(function(record) {
            var deferred = Q.defer(),
                moderatorUploadsRef = FirebaseService.getModeratorUploads(record.assignmentKey);

            FirebaseService.authWithSecret(moderatorUploadsRef).then(function(ref) {
                var uploadRef = ref.push();

                record.keys.moderator = uploadRef.key();

                uploadRef.set(record, function(err) {
                    return err ? deferred.reject(err) : deferred.resolve(record);
                });
            });

            return deferred.promise;
        }).then(function (record) {
            var deferred = Q.defer();

            FirebaseService.authWithSecret(FirebaseService.getUploads().child(record.keys.log)).then(function (ref) {
                ref.child('keys').update({moderator: record.keys.moderator}, function (err) {
                    return err ? deferred.reject(err) : deferred.resolve(record);
                });
            });

            return deferred.promise;
        }).then(function(record) {
            var deferred = Q.defer(),
                userAssignmentUploads = FirebaseService.getUserAssignmentUploads(userId, assignmentKey);

            deferred.resolve(record);

            FirebaseService.authWithSecret(userAssignmentUploads).then(function(ref) {
                ref.once('value', function(snap) {
                    var found = false;
                    snap.forEach(function(childSnap) {
                        var upload = childSnap.val();
                        if (upload.ETag === ETag) {
                            found = true;
                        }
                    });

                    if (!found) {
                        ref.push(record.upload, function(err) {
                            return err ? deferred.reject(err) : deferred.resolve(record);
                        });
                    } else {
                        deferred.reject("File already exists.");
                    }
                });

            });

            return deferred.promise;
        }).then(function(record) {
            res.json(record);
        }, function(err) {
            errorHandler(res, err);
        });

    },

    remove: function(req, res) {
        var userId = req.params.userId,
            Key = req.body.Key,
            deleteDeferred = Q.defer();

        S3.deleteObject({
            Bucket: publicBucket,
            Key: Key
        }, function(err, data) {
            return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
        });

        deleteDeferred.promise.then(function() {
            return FileService.updateUserFilesRegister(userId);
        }).then(function(s3Data) {
            res.json(s3Data);
        }, function(err) {
            errorHandler(res, err);
        });

    },

    queueFeedbackEmail: function(req, res) {
        MessageService.queueFeedbackEmail(req.params.userId, req.params.assignmentKey).then(function(queuedEmail) {
            res.json(queuedEmail);
        }, function(err) {
            res.status(500).send(err);
        });

    },

    sendQueuedEmail: function(req, res) {
        MessageService.sendQueuedEmail(req.params.emailKey).then(function(result) {
            res.sendStatus(200);
        }, function(err) {
            res.status(500).send(err);
        });
    },

    sendQueuedFeedback: function(req, res) {
        MessageService.sendAllQueuedFeedback().then(function(result) {
            res.sendStatus(200);
        }, function(err) {
            res.status(500).send(err);
        });
    },

    send: function(req, res) {
        MessageService.send(req.params.userId, req.params.recipientId, req.body.text).then(function(result) {
            res.sendStatus(200);
        }, function(err) {
            res.status(500).send(err);
        });
    }

};