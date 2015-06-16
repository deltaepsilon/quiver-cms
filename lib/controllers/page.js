var ConfigService = require('../services/config-service'),
    LogService = require('../services/log-service'),
    WordService = require('../services/word-service'),
    ObjectService = require('../services/object-service'),
    RedisService = require('../services/redis-service'),
    SearchService = require('../services/search-service'),
    Q = require('q'),
    app;

module.exports = {
    setApp: function(fn) {
        app = fn;
    },

    frontPage: function(req, res) {
        Q.all([ObjectService.getSettings(), ObjectService.getTheme()]).spread(function(settings, theme) {
            var pageTitle = theme && theme.frontPage && req.url !== '/blog' ? theme.frontPage : 'front-page',
                alternates = theme && theme.alternates ? Object.keys(theme.alternates) : [],
                promise;

            // console.log('theme', theme)
            // console.log('settings', settings);
            // console.log('pageTitle', pageTitle.split('.')[0]);
            // console.log('alternates', alternates)

            if (pageTitle === 'front-page' || ~alternates.indexOf(pageTitle.split('.')[0])) {
                promise = WordService.renderPosts(theme && theme.frontPage && req.url !== '/blog' ? theme.frontPage : 'front-page', 0, req.url, {
                    title: settings && settings.siteTitle ? settings.siteTitle : 'Quiver CMS'
                });
            } else {
                promise = WordService.renderLandingPage(pageTitle, req.app.get('views'));
            }

            promise.then(function(html) {
                res.status(200).send(html);
                RedisService.setPage(req.url, html);
            }, function(err) {
                res.status(500).send(err);
            });

        });

    },

    posts: function(req, res) {
        WordService.renderPosts('posts', req.params.page, req.url).then(function(html) {
            res.status(200).send(html);
            RedisService.setPage(req.url, html);
        }, function(err) {
            res.status(500).send(err);
        });

    },

    page: function(req, res) {
        var slug = req.params.slug;

        Q.all([ObjectService.getSettings(), ObjectService.getWord(slug)]).spread(function(settings, post) {
            if (post) {
                app.render('page', {
                    development: ConfigService.get('public.environment') === 'development',
                    post: post,
                    settings: settings,
                    url: req.url,
                    slug: slug,
                    env: ConfigService.get('public')
                }, function(err, html) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(html);
                        RedisService.setPage(req.url, html);

                    }
                });
            } else {
                return WordService.render404(res, 'Page not found.');
            }


        }, function(err) {
            LogService.error(404, err);
            WordService.render404(res, err);
        });

    },

    search: function(req, res) {
        var deferred = Q.defer(),
            searchTerm = req.params.searchTerm;

        Q.all([ObjectService.getSettings(), SearchService.hashtag(searchTerm)]).spread(function(settings, posts) {
            app.render('posts', {
                development: ConfigService.get('public.environment') === 'development',
                title: "Search: " + searchTerm,
                posts: posts,
                settings: settings,
                url: req.url
            }, function(err, html) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(html);
                    RedisService.setPage(req.url, html);

                }
            });

        });

    }

};