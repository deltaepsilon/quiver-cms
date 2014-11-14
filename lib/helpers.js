module.exports = function (options) {
  var moment = require('moment'),
    expressHandlebars = require('express-handlebars'),
    handlebars = expressHandlebars.create(),
    Showdown = require('showdown'),
    mdConverter = new Showdown.converter({
      extensions: [require('./extensions/video.js')]
    });

  return {
    active: function (href, url) {
      return href === url ? 'active' : '';
    },

    s3: function (key) {
      return 'https://s3.amazonaws.com/' + options.bucket + '/' + key;
    },

    deSlug: function (name) {
      var name = name.split('.')[0],
        parts = name.split('-'),
        i = parts.length;

      while (i--) {
        parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
      }

      return parts.join(' ');
    },

    calendar: function (date) {
      return moment(date).calendar();
    },

    date: function (date, format) {
      return moment(date).utc().format(typeof format === 'string' ? format : undefined);
    },

    markdown: function (md) {
      return new handlebars.handlebars.SafeString(mdConverter.makeHtml(md));
    },

    json: function (obj) {
      return JSON.stringify(obj);
    },

    currency: function (number, symbol) {
      var value = Math.round(number + 100)/100,
        modulus = Math.round(value%1 * 100) / 100 || '0.00',
        symbol = typeof symbol === 'string' ? symbol : '';
      return symbol + Math.round(value) + '.' + modulus.toString().split('.')[1];
    }

  };
};
