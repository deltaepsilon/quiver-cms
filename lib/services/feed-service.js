var Q = require('q'),
	Feed = require('feed'),
	ObjectService = require('./object-service'),
	Utility = require('../extensions/utility'),
	ConfigService = require('./config-service');

module.exports = {
	getFeed: function (cb) {
		var deferred = Utility.async(cb);

		ObjectService.getWords().then(function (words) {
		  var feedOptions = _.defaults(ConfigService.get('public.rss'), {pubDate: new Date()}),
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

		        markdown = '!['+ (word.keyImage.Name || keyImage.Key) + '](' + helpers.s3(keyImage.Key) + ')\n\n' + markdown;
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
	}
};