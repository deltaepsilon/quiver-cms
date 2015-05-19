var BackupService = require('../services/backup-service'),
    request = require('request');

module.exports = {
    run: function(req, res) {
        BackupService.run().then(function(data) {
            res.sendStatus(200);
        }, function(error) {
            res.status(500).send(error);
        });
    },

    update: function(req, res) {
        BackupService.update().then(function(data) {
            res.sendStatus(200);
        }, function(error) {
            res.status(500).send(error);
        });
    },

    download: function(req, res) {
        req.pipe(request(BackupService.getUrl(req.params.filename))).pipe(res); // Pipe the stream through 
    }
}