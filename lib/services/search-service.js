var ObjectService = require('./object-service'),
  	LogService = require('./log-service'),
	ConfigService = require('./config-service'),
	// ElasticSearchClient = require('elasticsearchclient'),
	// elasticSearchClient = new ElasticSearchClient(ConfigService.get('private.elasticsearch')),
	// elasticSearchIndex = ConfigService.get('private.elasticsearch.index'),
	Utility = require('../extensions/utility'),
	Q = require('q'),
	_ = require('underscore');

module.exports = {
	createIndex: function (words, cb) {
		var deferred = Utility.async(cb);
		
		console.log('Full text search disabled... elasticsearch is just too heavy for this purpose.');

		deferred.resolve();

		return deferred.promise;
		// var deferred = Utility.async(cb),
	 //      deleteDeferred = Q.defer(),
	 //      commands = [];

		// elasticSearchClient.deleteByQuery(elasticSearchIndex, "word", {"match_all": {}}, function (err, data) {
		// 	return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
		// });

		// deleteDeferred.promise.then(function () {
		// 	_.each(words, function (word, key) {
		// 		if (word.type !== 'subscription') {
		// 			if (word.keyImage && !word.keyImage.Versions) {
		// 				word.keyImage.Versions = {}; // This prevents a mapping error in elasticsearch. It doesn't like "keyImage.Versions: false"
		// 			}
		// 			commands.push({"index": {"_index": elasticSearchIndex, "_type": "word"}});
		// 			commands.push(word);
		// 		}

		// 	});

		// 	elasticSearchClient.bulk(commands, {})
		// 	.on('data', function (data) {
		// 	//          var commands = JSON.parse(data);
		// 	//          _.each(commands, console.log);
		// 	})
		// 	.on('done', deferred.resolve)
		// 	.on('error', deferred.reject)
		// 	.exec();
		// }, function (err) {
		// 	LogService.error('elasticsearch delete', err);
		// });

		// return deferred.promise;
	
	},

	fullText: function (term, cb) {
		console.log('Full text search disabled... elasticsearch is just too heavy for this purpose.');
		return this.hashtag(term, cb);
		// var deferred = Utility.async(cb);

		// elasticSearchClient.search(elasticSearchIndex, "word", {"query": {"query_string": {"query": term}}}, function (err, data) {
		// 	if (err) {
		// 		deferred.reject(err);
		// 	} else {
		// 		var data = JSON.parse(data),
		// 			hits = data.hits.hits,
		//       words = [];

		//     _.each(hits, function (hit) {
		//       words.push(hit._source);
		//     });

		//     return deferred.resolve(words);

		// 	}
			
	 //  });

	 //  return deferred.promise;

	},

	hashtag: function (tag, cb) {
		var deferred = Utility.async(cb);

		ObjectService.getWords(function (err, words) {
			var filtered = _.filter(_.toArray(words), function (word) {
					var hashtags = _.pluck(word.hashtags, 'key') || [],
						mapped = _.map(hashtags, function (hashtag) {
							return hashtag.toLowerCase();
						});
					return ~mapped.indexOf(tag.toLowerCase());
				});
			deferred.resolve(filtered);
		});

		return deferred.promise;
	}
};