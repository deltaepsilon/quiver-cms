var ConfigService = require('../services/config-service'),
    ObjectService = require('../services/object-service'),
    massageTheme = function (theme) {
        if (theme.palette && theme.palette.overrides) {
            if (theme.palette.overrides.primary) {
                if (theme.palette.overrides.primary.contrastDarkColors) {
                    theme.palette.overrides.primary.contrastDarkColors = Object.keys(theme.palette.overrides.primary.contrastDarkColors);
                }
                if (theme.palette.overrides.primary.contrastLightColors) {
                    theme.palette.overrides.primary.contrastLightColors = Object.keys(theme.palette.overrides.primary.contrastDarkColors);
                }
            }
            if (theme.palette.overrides.accent) {
                if (theme.palette.overrides.accent.contrastDarkColors) {
                    theme.palette.overrides.accent.contrastDarkColors = Object.keys(theme.palette.overrides.accent.contrastDarkColors);
                }
                if (theme.palette.overrides.accent.contrastLightColors) {
                    theme.palette.overrides.accent.contrastLightColors = Object.keys(theme.palette.overrides.accent.contrastDarkColors);
                }
            }
        }
        return theme;
    };

module.exports = {
    env: function(req, res) {
        var env = ConfigService.get('public');
        ObjectService.getTheme(function(err, theme) {
            env.theme = massageTheme(theme);
            res.setHeader('Content-Type', 'application/json');
            res.json(env);
        });
    },

    envJS: function(req, res) {
        var env = ConfigService.get('public');
        ObjectService.getTheme(function(err, theme) {
            env.theme = massageTheme(theme);
            res.setHeader('Content-Type', 'application/javascript');
            res.status(200).send("window.envVars = " + JSON.stringify(ConfigService.get('public')) + ';');    
        });
    }
};