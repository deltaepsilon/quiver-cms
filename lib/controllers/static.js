var ConfigService = require('../services/config-service'),
    Q = require('q'),
    fs = require('fs'),
    mime = require('mime'),
    moment = require('moment'),
    _ = require('underscore'),
    htmlDateFormat = "ddd, DD MMM YYYY HH:mm:ss",
    RedisService = require('../services/redis-service'),
    ObjectService = require('../services/object-service'),
    ConfigService = require('../services/config-service'),
    Sitemap = require('sitemap');

var getHandler = function(name, isFile) {
    return function(req, res) {
        var deferred = Q.defer(),
            route = ['.', ConfigService.get('private.cms.folder'), name],
            parts = req.url.split('/'),
            path,
            i = parts.length;

        if (isFile) { // Serve individual file regardless of path
            path = route.join('/');
        } else { // Clean up folder paths
            while (i--) {
                if (parts[i] === '') {
                    parts.splice(i, 1);
                }
            }

            path = route.concat(parts).join('/');
        }

        path = path.split('?')[0]; // Drop query strings
        res.setHeader('Content-Type', mime.lookup(path));
        res.setHeader('Cache-Control', 'max-age=34536000');
        res.setHeader('Expires', moment().add(5, 'year').format(htmlDateFormat)) + ' GMT';

        fs.readFile(path, function(err, data) {
            return err ? deferred.reject(err) : deferred.resolve(data);
        });

        deferred.promise.then(function(data) {
            res.status(200).send(data);
        }, function(err) {
            LogService.error(404, path, err);
            res.sendStatus(404);
        });
    };
};

var content = function(req, res) {
    var deferred = Q.defer();

    ObjectService.getTheme(function(err, theme) {
        var theme = theme || {
                active: 'quiver'
            },
            route = ['.', 'themes', theme.active, 'static'],
            parts = req.url.split('/'),
            path;

        parts.shift(); // Drop the blank part of the route

        path = route.concat(parts).join('/');
        path = path.split('?')[0]; // Drop query strings
        res.setHeader('Content-Type', mime.lookup(path));
        res.setHeader('Cache-Control', 'max-age=34536000');
        res.setHeader('Expires', moment().add(5, 'year').format(htmlDateFormat)) + ' GMT';

        //  console.log('path', path);
        fs.readFile(path, function(err, data) {
            return err ? deferred.reject(err) : deferred.resolve(data);
        });

    });


    deferred.promise.then(function(data) {
        res.status(200).send(data);
        RedisService.cachePage('/static' + req.url, data);
    }, function(err) {
        res.sendStatus(404);
    });
};

module.exports = {
    getHandler: getHandler,

    content: content,

    file: function(filename) {
        return function(req, res, next) {
            req.url = '/' + filename;
            content(req, res);
        }

    },

    sitemap: function(req, res) {
        var includedTypes = ['page', 'post'];

        Q.all([ObjectService.getWords(), ObjectService.getProducts()]).spread(function(words, products) {
            var urls = [{
                url: '/blog',
                changefreq: 'daily',
                priority: 0.3
            }, {
                url: '/products',
                changefreq: 'weekly',
                priority: 0.3
            }];

            _.each(words, function(word) {
                if (word.published && ~includedTypes.indexOf(word.type)) {
                    urls.push({
                        url: '/' + word.slug,
                        changefreq: word.sitemap && word.sitemap.changefreq ? word.sitemap.changefreq : 'weekly',
                        priority: word.sitemap && word.sitemap.priority ? word.sitemap.priority : 0.5
                    });
                }
            });

            _.each(products, function(product) {
                if (product.active && product.isValid) {
                    urls.push({
                        url: '/product/' + product.slug,
                        changefreq: product.sitemap && product.sitemap.changefreq ? product.sitemap.changefreq : 'weekly',
                        priority: product.sitemap && product.sitemap.priority ? product.sitemap.priority : 0.5
                    });
                }
            });
            Sitemap.createSitemap({
                hostname: ConfigService.get('public.root'),
                cacheTime: 60 * 30 * 24,
                urls: urls
            }).toXML(function(err, xml) {
                res.header('Content-Type', 'application/xml');
                res.send(xml);
            });
        });

    }

};