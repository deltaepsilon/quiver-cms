var ObjectService = require('./object-service'),
	ConfigService = require('./config-service'),
	Utility = require('../extensions/utility'),
	Q = require('q'),
	_ = require('underscore'),
	app;

var getPaginated = function (cb) {
	var deferred = Utility.async(cb);

	Q.all([ObjectService.getWords(), ObjectService.getSettings()]).spread(function (words, settings) {
    var settings = settings || {},
      primaryPostCount = settings.primaryPostCount || 1,
      secondaryPostCount = settings.secondaryPostCount || 4,
      tertiaryPostCount = settings.tertiaryPostCount || 10,
      firstPageCount = primaryPostCount + secondaryPostCount + tertiaryPostCount,
      posts = [],
      getPostsLength = function () {
        var length = 0,
          i = posts.length;
        while (i--) {
          length += posts[i].length;
        }
        return length;
      };

    words = _.sortBy(words, function (word) {
      return -1 * word.order;
    });

    _.each(words, function (word) {
      if (word.published && word.type === 'post') {
        var length = getPostsLength(),
          nextPage = 0;

        if (length +1 >= firstPageCount) {
          nextPage = Math.ceil((length + 2 - firstPageCount) / tertiaryPostCount);
        }

        if (!posts[nextPage]) {
          posts[nextPage] = [];
        }

        posts[nextPage].push(word);
      }

    });

    deferred.resolve(posts);
		
	});

  
  return deferred.promise;	
	
};

module.exports = {
	setApp: function (obj) {
		app = obj;
	},

	getPaginated: getPaginated,

	renderPosts: function (template, page, url, options, cb) {
		
		var deferred = Utility.async(cb),
      page = parseInt(page);
	
		Q.all([ObjectService.getSettings(), ObjectService.getHashtags(), getPaginated()]).spread(function (settings, hashtags, paginated) {
			var settings = settings || {},
        posts = paginated[page],
	      nextPage = paginated[page + 1] ? page + 1 : null,
	      prevPage = page > 0 ? page - 1 : null,
	      title = (settings.siteTitle || url)  + ': Posts: ' + page,
	      primaryMax = settings.primaryPostCount || 1,
	      secondaryMax = (settings.secondaryPostCount || 4) + primaryMax,
	      tertiaryMax = (settings.tertiaryPostCount || 10) | secondaryMax,
	      postBlocks = {
	        primary: [],
	        secondary: [],
	        tertiary: [],
	        extras: []
	      },
	      counter = 0,
	      context;

	    if (prevPage === 0) {
	      prevPage = '0';
	    }

	    // Create post blocks
	    _.each(posts, function (post) {
	      counter += 1;
	      if (counter <= primaryMax) {
	        post.postBlock = 'primary';
	        postBlocks.primary.push(post);
	      } else if (counter <= secondaryMax) {
	        post.postBlock = 'secondary';
	        postBlocks.secondary.push(post);
	      } else if (counter <= tertiaryMax) {
	        post.postBlock = 'tertiary';
	        postBlocks.tertiary.push(post);
	      } else {
	        post.postBlock = 'extras';
	        postBlocks.extras.push(post);
	      }
	    });

	    context = {
	      development: ConfigService.get('public.environment') === 'development',
	      env: ConfigService.get('public'),
	      posts: posts,
	      postBlocks: postBlocks,
	      settings: settings,
	      hashtags: hashtags,
	      url: url,
	      nextPage: nextPage,
	      prevPage: prevPage,
	      title: title
	    };

	    app.render(template, _.defaults(options || {}, context), function (err, html) {
	      return err ? deferred.reject(err) : deferred.resolve(html);
	    });
			
		}, deferred.reject);

		deferred.promise.then(function (html) { // Set cache
      RedisService.setPage(url, html);
    });

    return deferred.promise;
		
	},

	render404: function (res, err) {
		ObjectService.getSettings(function (err, settings) {
			app.render('404', {
	      development: ConfigService.get('public.environment') === 'development',
	      settings: settings,
	      error: err
	    }, function (err, html) {
	      if (err) {
	        res.status(500).send(err);
	      } else {
	        res.status(404).send(html);
	      }
	    });
			
		});
    
  }

};