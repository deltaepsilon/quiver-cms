var ReportService = require('../services/report-service');

module.exports = {
    run: function(req, res) {
        ReportService.run().then(function(data) {
            res.json({
                data: data
            });
        }, function(error) {
            res.status(500).send(error);
        });
    }
}