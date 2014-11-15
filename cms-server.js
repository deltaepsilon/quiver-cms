var express = require('express'),
  app = express(),
  _ = require('underscore');

/*
 * Services
 */
var ConfigService = require('./lib/services/config-service'),
  LogService = require('./lib/services/log-service'),
  TemplateService = require('./lib/services/template-service'),
  RedisService = require('./lib/services/redis-service');

/*
 * Controllers
 */
 var UserController = require('./lib/controllers/user'),
  AdminController = require('./lib/controllers/admin'),
  StaticController = require('./lib/controllers/static'),
  FormController = require('./lib/controllers/form'),
  TemplateController = require('./lib/controllers/template'),
  EnvironmentController = require('./lib/controllers/environment'),
  DiscountController = require('./lib/controllers/discount'),
  FileController = require('./lib/controllers/file'),
  SocialController = require('./lib/controllers/social'),
  CacheController = require('./lib/controllers/cache'),
  PaymentController = require('./lib/controllers/payment'),
  CheckoutController = require('./lib/controllers/checkout'),
  TransactionController = require('./lib/controllers/transaction'),
  Middleware = require('./lib/controllers/middleware');

/*
 * Static
 */
if (ConfigService.get('private.cms.staticEnabled')) {
  LogService.info('Serving static files from /' + ConfigService.get('private.cms.folder'));

  _.each(['images', 'lib', 'scripts', 'styles', 'views'], function (folder) {
    app.use('/' + folder, StaticController.getHandler(folder));
    app.use('/app/' + folder, StaticController.getHandler(folder));
    app.use('/app/admin/' + folder, StaticController.getHandler(folder));

  });


  app.use('/app/admin/words/*', Middleware.redirect('/app/admin/words'));

  app.use('/app', StaticController.getHandler('index.html', true));

} else {
  LogService.info('Not service static files from ' + ConfigService.get('private.cms.folder') + ". Make sure you're serving them with nginx or some other static file server.");
}

/*
 * Access Control Headers
 */
app.use(Middleware.accessControl);

/*
 * Themes
*/
TemplateService.setThemes();
app.get('/themes', TemplateController.themes);

/*
 * Alternates
*/
TemplateService.setAlternates();
app.get('alternates', TemplateController.alternates);

/*
 * Env
*/
app.get('/env', EnvironmentController.env);
app.get('/env.js', EnvironmentController.envJS);

/*
 * Discounts
 */
RedisService.setDiscounts();
app.get('/discounts/:code', DiscountController.getCode);
app.post('/discounts/refresh', FormController.body);
app.post('/discounts/refresh', DiscountController.refresh);
app.get('/admin/discounts', DiscountController.getDiscounts);


/*
 * Authenticate user and hydrate req.user
*/
app.use(UserController.hydrateUser);
app.use('/admin', AdminController.validateAdmin);

/*
 * REST
 * 1. Files
 * 2. Social
 * 3. Redis
 * 4. User
 * 5. Payment
 * 6. Checkout
*/

/*
 * File endpoints
 */
app.get('/admin/files/update', FileController.filesUpdate);
app.get('/admin/files', FileController.get);
app.post('/admin/files', FormController.flow); // Use formidable body parser... the Flow variety
app.post('/admin/files', FileController.post);
app.delete('/admin/files/:fileName', FileController.remove);
app.get('/admin/files/resize', FileController.resize);

/*
 * Social
*/
app.get('/admin/instagram', SocialController.searchInstagram);

/*
 * Redis
*/
app.get('/admin/clear-cache', CacheController.clearCache);

/*
 * User
*/
app.get('/user/:userId', UserController.get);

/*
 * Payment
 */
 app.get('/user/payment/token', PaymentController.getClientToken);
 app.post('/user/payment/:nonce/nonce', PaymentController.createPaymentMethod);
 app.delete('/user/payment/:token/token', PaymentController.removePaymentMethod);

/*
 * Checkout
 */
app.post('/user/checkout', FormController.body);
app.post('/user/checkout', CheckoutController.checkout);
app.post('/admin/transaction/:key/email', TransactionController.email);
app.post('/admin/transaction/:key/charge', TransactionController.charge);

/*
 * Finish this sucka up
*/
LogService.info("Serving on port " + ConfigService.get('private.cms.port'));
app.listen(ConfigService.get('private.cms.port'));