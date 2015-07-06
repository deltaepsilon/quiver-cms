var LogService = require('../services/log-service'),
    fs = require('fs'),
    mainFilename = require.main.filename.match(/[^\/-]+.js/)[0],
    getFilename = function (type) {
        return './logs/' + type + '-' + mainFilename + '.log';
    };

return module.exports = {
    view: function(req, res) {
        var filename = getFilename(req.params.type);

        if (filename) {
            fs.readFile(filename, 'utf8', function(err, text) {
                if (err) {
                    LogService.error('Log view', err);
                    return res.sendStatus(500);
                } else {
                    var lines = text.split('\n'),
                        i = lines.length,
                        results = [];

                    while (i--) {
                        if (lines[i].length) {
                            results.push(JSON.parse(lines[i]));
                        }

                    }
                    res.json(results);
                }

            });
        } else {
            res.json([]);
        }

    },

    delete: function (req, res) {
        var filename = getFilename(req.params.type);

        if (filename) {
            fs.writeFile(filename, '', function () {
               res.sendStatus(200); 
            });
        } else {
            return res.sendStatus(500);
        }     
    }
}