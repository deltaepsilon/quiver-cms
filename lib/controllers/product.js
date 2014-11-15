var Q = require('q'),
	ConfigService = require('../services/config-service'),
	ObjectService = require('../services/object-service'),
	render;

module.exports = {
	setRender: function (renderFn) {
		render = renderFn;		
	},

	products: function (req, res) {
		ObjectService.getSettings(function (err, settings) {
			render('products', {
				development: ConfigService.get('public.environment') === 'development',
				title: 'Products: ' + settings.siteTitle,
				products: products,
				settings: settings,
				url: req.url
			}, function (err, html) {
				return err ? res.status(500).send(err) : res.status(200).send(html);
			});
			
		});
		
	},

	product: function (req, res) {
		Q.all([ObjectService.getSettings(), ObjectService.getProducts()]).spread(function (settings, products) {
			var slug = req.params.slug,
		    product = _.find(products, function (product) {
		      return product.slug === slug;
		    });

		  app.render('product', {
		    development: ConfigService.get('public.environment') === 'development',
		    product: product,
		    useInventoryMatrix: typeof product.inventory === 'undefined',
		    settings: settings,
		    title: product.title + ': ' + settings.siteTitle,
		    url: req.url
		  }, function (err, html) {
		  	return err ? res.status(500).send(err) : res.status(200).send(html);
		  });
			
		});
		
	}

};