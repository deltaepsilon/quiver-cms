var TemplateService = require('../services/template-service'),
    WordService = require('../services/word-service');

module.exports = {
    themes: function(req, res) {
        TemplateService.setThemes().then(function(result) {
            res.json(result);
        }, function() {
            res.sendStatus(500);
        });
    },

    alternates: function(req, res) {
        TemplateService.setAlternates().then(function(result) {
            res.json(result);
        }, function() {
            res.sentStatus(500);
        });
    },

    resetPage: function(req, res) {
        WordService.resetLandingPage(req.params.slug).then(function(result) {
            res.json(result);
        }, function(err) {
            console.log('err', err);
            res.status(500).send(err);
        });
    }

};