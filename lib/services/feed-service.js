var Q = require('q');
var Feed = require('feed');
var ObjectService = require('./object-service');
var Utility = require('../extensions/utility');
var ConfigService = require('./config-service');
var FirebaseService = require('./firebase-service');
var _ = require('underscore');
var md5 = require('md5');

module.exports = {
  getFeed: function (cb) {
    var deferred = Utility.async(cb);

    ObjectService.getWords().then(function (words) {
      var feedOptions = _.defaults(ConfigService.get('public.rss'), {
          pubDate: new Date()
        }),
        feed = new Feed(feedOptions),
        root = ConfigService.get('public.root'),
        words = _.sortBy(words, function (word) {
          return -1 * word.order;
        });

      _.each(words, function (word) {
        if (word.published) {
          var categories = [],
            item,
            keyImage = word.keyImage,
            markdown = word.published.markdown;

          _.each(word.hashtags, function (hashtag) {
            categories.push(hashtag.key);
          });

          if (keyImage) {
            if (keyImage.Versions && keyImage.Versions.small) {
              keyImage = keyImage.Versions.small;
            }

            markdown = '![' + (word.keyImage.Name || keyImage.Key) + '](' + helpers.s3(keyImage.Key) + ')\n\n' + markdown;
          }

          item = {
            "title": word.title || "no title",
            "link": root + '/' + word.slug,
            "description": word.excerpt || "no description",
            "date": new Date(word.published.published),
            "guid": word.slug,
            "categories": categories,
            "author": [{
              name: word.author.name,
              email: word.author.email,
              link: word.author.website
            }],
            "content": mdConverter.makeHtml(markdown)

          };

          if (word.location && word.location.key) {
            item.lat = word.location.key.lat;
            item.long = word.location.key.lng;
          }

          feed.addItem(item);

        }

      });

      deferred.resolve(feed);

    }, deferred.reject);

    return deferred.promise;
  },

  convertShipmentToFulfillment: function (shipment) {
    var gramsPerOunce = 28.3495;

    if (!shipment) {
      return null;
    } else {
      return {
        created_at: shipment.created,
        updated_at: shipment.updated || shipment.created,
        id: shipment.id || shipment.keys.log,
        order_id: shipment.order_id || shipment.keys.log,
        address: shipment.transaction.address,
        receipt: shipment.receipt || null,
        status: shipment.shipped ? 'success' : shipment.status,
        tracking_company: shipment.trackingCompany || null,
        tracking_numbers: shipment.trackingNumbers || [],
        tracking_urls: shipment.trackingUrls || [],
        variant_inventory_management: shipment.variantInventoryManagement || null,
        line_items: _.map(shipment.items || [shipment.item], function (item) {
          var lineItem;
          try {
            var lineItem = {
              fulfillable_quantity: item.quantity,
              fulfillment_service: item.fulfillmentService || null,
              fulfillment_status: item.fulfillmentStatus || null,
              grams: Math.round(item.weight * gramsPerOunce),
              id: [item.shipmentKey, item.key].join('|'),
              price: item.priceAdjusted || item.price,
              product_id: item.key,
              quantity: item.quantity,
              requires_shipping: true,
              sku: item.slug + (item.optionsMatrixSelected ? '-' + item.optionsMatrixSelected.slug : ''),
              title: item.title,
              variant_id: item.optionsMatrixSelected ? item.optionsMatrixSelected.slug : item.slug,
              vendor: item.vendor || ConfigService.get('public.structuredOrganization.name'),
              name: item.title + (item.optionsMatrixSelected ? ' - ' + item.optionsMatrixSelected.name : ''),
              variant_inventory_management: item.variantInventoryManagement || null,
              properties: item.properties || [],
              product_exists: item.productExists || true
            };
          } catch (e) {
            lineItem = e.toString();
          }
          return lineItem;
        })
      };
    }
  },

  combineShipments: function (shipments) {
  	var grouped = _.groupBy(shipments, function (shipment) {
  		return md5(JSON.stringify(shipment.transaction.address));
  	});
  	return _.map(grouped, function (group) {
  		var shipment = group[0];
  		shipment.id = _.map(group, function (shipment) {
  			return shipment.keys.log;
  		}).join('|');
  		shipment.order_id = shipment.id;
  		shipment.items = _.map(group, function (shipment) {
        shipment.item.shipmentKey = shipment.keys.log;
  			return shipment.item;
  		});

  		delete shipment.item;
  		return shipment;
  	});
  }
};