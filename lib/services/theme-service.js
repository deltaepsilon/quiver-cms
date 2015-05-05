var RedisService = require('./redis-service'),
    Utility = require('../extensions/utility'),
    FirebaseService = require('./firebase-service'),
    LogService = require('./log-service'),
    _ = require('underscore'),
    Slug = require('slug'),
    fs = require('fs');

return module.exports = {
    setTheme: function(cb) {
        var deferred = Utility.async(cb);

        RedisService.setTheme().then(function(theme) {
            var themes = fs.readdirSync('./themes'),
                options = {},
                alternates = [],
                views;

            _.each(themes, function(theme) {
                if (theme[0] !== '.') {
                    options[theme] = theme;
                }
            });

            if (!theme) {
                theme = {};
            }

            theme.options = options;

            if (!theme.active) {
                theme.active = Object.keys(theme.options)[0];
            }

            try {
                views = fs.readdirSync('./themes/' + theme.active + '/views');
            } catch (e) {
                console.log('Theme not found', e);
                LogService.log('Theme not found', e);
                views = fs.readdirSync('./themes/quiver/views');
            }

            _.each(views, function(file) {
                var parts = file.split('.'),
                    name,
                    slug;

                if (!parts[0].match(/:/) && parts.length > 2 && parts[parts.length - 2] === 'alt') {
                    parts.splice(parts.length - 2)
                    name = parts.join('.');
                    slug = Slug(name);
                    alternates[slug] = {
                        filename: file,
                        name: name,
                        slug: slug
                    }
                }
            });

            theme.alternates = alternates;

            FirebaseService.getTheme().set(theme, function(error) {
                deferred.resolve(theme);
            });

        });

        return deferred.promise;
    }

};