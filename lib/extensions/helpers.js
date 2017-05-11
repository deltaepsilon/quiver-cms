var ConfigService = require('../services/config-service'),
  moment = require('moment'),
  expressHandlebars = require('express-handlebars'),
  handlebars = expressHandlebars.create(),
  Showdown = require('showdown'),
  mdConverter = new Showdown.Converter({
    extensions: [require('./video')]
  }),
  bucket = ConfigService.get('public.amazon.publicBucket')
  _ = require('lodash');

module.exports = {
  active: function(href, url) {
    return href === url ? 'active' : '';
  },

  s3: function(key) {
    return 'https://s3.amazonaws.com/' + bucket + '/' + key;
  },

  deSlug: function(name) {
    var name = name.split('.')[0], parts = name.split('-'), i = parts.length;

    while (i--) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    }

    return parts.join(' ');
  },

  calendar: function(date) {
    return moment(date).calendar();
  },

  date: function(date, format) {
    return moment(date).utc().format(typeof format === 'string' ? format : undefined);
  },

  markdown: function(md) {
    return !md ? '' : new handlebars.handlebars.SafeString(mdConverter.makeHtml(md));
  },

  json: function(obj) {
    return JSON.stringify(obj);
  },

  currency: function(number, symbol) {
    var value = Math.round(number * 100) / 100,
      modulus = Math.round(value % 1 * 100) / 100 || '0.00',
      symbol = typeof symbol === 'string' ? symbol : '',
      result = symbol + Math.floor(value) + '.' + modulus.toString().split('.')[1];
    return result;
  },

  isSubscription: function(type, options) {
    if (type == 'subscription') {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  },

  productsItemList: function(products) {
    var list = {
      '@context': 'http://schema.org',
      '@type': 'ItemList',
      itemListElement: _.toArray(products).filter(function(product) {
        return  product.active && product.type == 'subscription';
      }).map(function(product, i) {
        return {
          '@context': 'http://schema.org',
          '@type': 'Course',
          name: product.seoTitle,
          description: product.shortDescription || product.seoDescription,
          provider: {
            '@type': 'Organization',
            name: 'Calligraphy.org',
            sameAs: 'https://www.calligraphy.org/'
          },
          position: i + 1,
          url: 'https://www.calligraphy.org/product/' + product.slug
        };
      })
    };
    return new handlebars.handlebars.SafeString(JSON.stringify(list));
  }
};
