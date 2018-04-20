var ConfigService = require('../services/config-service'),
  ObjectService = require('../services/object-service'),
  massageTheme = function(theme) {
    if (theme.palette && theme.palette.overrides) {
      if (theme.palette.overrides.primary) {
        if (typeof theme.palette.overrides.primary.contrastDarkColors === 'object') {
          theme.palette.overrides.primary.contrastDarkColors = Object.keys(
            theme.palette.overrides.primary.contrastDarkColors
          );
        }
        if (typeof theme.palette.overrides.primary.contrastLightColors === 'object') {
          theme.palette.overrides.primary.contrastLightColors = Object.keys(
            theme.palette.overrides.primary.contrastLightColors
          );
        }
      }
      if (theme.palette.overrides.accent) {
        if (typeof theme.palette.overrides.accent.contrastDarkColors === 'object') {
          theme.palette.overrides.accent.contrastDarkColors = Object.keys(
            theme.palette.overrides.accent.contrastDarkColors
          );
        }
        if (typeof theme.palette.overrides.accent.contrastLightColors === 'object') {
          theme.palette.overrides.accent.contrastLightColors = Object.keys(
            theme.palette.overrides.accent.contrastLightColors
          );
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
      res.status(200).send('window.envVars = ' + JSON.stringify(ConfigService.get('public')) + ';');
    });
  },

  newRelic: function(NewRelic) {
    return function(req, res) {
      if (NewRelic && typeof NewRelic.getBrowserTimingHeader === 'function') {
        res.send(NewRelic.getBrowserTimingHeader());
      } else {
        res.send("<script>console.info('New Relic timings header not inserted.');</script>");
      }
    };
  },
  newRelicJS: function(NewRelic) {
    return function(req, res) {
      if (NewRelic && typeof NewRelic.getBrowserTimingHeader === 'function') {
        res.send(NewRelic.getBrowserTimingHeader().replace(/(<script.*?>|<\/script>)/g, ''));
      } else {
        res.send("console.info('New Relic timings header not inserted.');");
      }
    };
  },
};
