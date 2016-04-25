var Q = require('q'),
    ConfigService = require('../services/config-service'),
    ObjectService = require('../services/object-service'),
    PerfService = require('../services/perf-service'),
    _ = require('underscore'),
    app;

module.exports = {
    setApp: function(fn) {
        app = fn;
    },

    products: function(req, res) {
        Q.all([ObjectService.getSettings(), ObjectService.getProducts()]).spread(function(settings, products) {
            app.render('products', {
                development: ConfigService.get('public.environment') === 'development',
                products: products,
                settings: settings,
                title: 'Products | ' + settings.siteTitle,
                url: req.url,
                env: ConfigService.get('public')
            }, function(err, html) {
                html = PerfService.processHTML(html);
                return err ? res.status(500).send(err) : res.status(200).send(html);
            });

        });

    },

    hashtag: function(req, res) {
        Q.all([ObjectService.getSettings(), ObjectService.getProducts()]).spread(function(settings, products) {

            var hashtag = req.params.hashtag,
                title,
                matching = _.filter(products, function(product) {
                    var match = _.findWhere(product.hashtags, {
                        key: hashtag
                    });
                    if (!match) {
                        return false;
                    } else if (!title) {
                        title = 'Search: ' + match.value;
                        return true;
                    } else {
                        return true;
                    }
                });

            app.render('products', {
                development: ConfigService.get('public.environment') === 'development',
                title: title,
                breadcrumbs: [{
                    href: '/products',
                    text: 'All products'
                }],
                products: matching,
                settings: settings,
                url: req.url,
                env: ConfigService.get('public')
            }, function(err, html) {
                html = PerfService.processHTML(html);
                return err ? res.status(500).send(err) : res.status(200).send(html);
            });

        });

    },

    product: function(req, res) {
        Q.all([ObjectService.getSettings(), ObjectService.getProducts()]).spread(function(settings, products) {
            var slug = req.params.slug,
                product = _.find(products, function(product) {
                    return product.slug === slug;
                }),
                useInventoryMatrix = product.optionsMatrix && _.find(product.optionsMatrix, function(option) {
                    return typeof option.inventory !== undefined;
                }),
                inStock = false;

            if (product.optionsMatrix && _.findWhere(product.optionsMatrix, {
                    inStock: true
                })) {
                inStock = true;
            } else if (!useInventoryMatrix && (typeof product.inventory === 'undefined' || product.inventory > 0)) {
                inStock = true;
            }

            var context = {
                development: ConfigService.get('public.environment') === 'development',
                product: product,
                useInventoryMatrix: useInventoryMatrix,
                inStock: inStock,
                settings: settings,
                title: (product.seoTitle || product.title) + ' | ' + settings.siteTitle,
                description: product.seoDescription,
                breadcrumbs: [{
                    href: '/products',
                    text: 'All products'
                }],
                url: req.url,
                env: ConfigService.get('public')
            };

            context.title = context.title.trim();

            app.render('product', context, function(err, html) {
                html = PerfService.processHTML(html);
                return err ? res.status(500).send(err) : res.status(200).send(html);
            });

        });

    }

};