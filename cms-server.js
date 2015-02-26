var express = require('express'),
  app = express(),
  _ = require('underscore');

/*
 * Services
 */
var ConfigService = require('./lib/services/config-service'),
  LogService = require('./lib/services/log-service'),
  TemplateService = require('./lib/services/template-service'),
  CronService = require('./lib/services/cron-service'),
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
  SubscriptionController = require('./lib/controllers/subscription'),
  MessageController = require('./lib/controllers/message'),
  ShipmentController = require('./lib/controllers/shipment'),
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

  app.use('/app/transaction/*', StaticController.getHandler('index.html', true));

  app.use('/app/subscription/*', StaticController.getHandler('index.html', true));

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
RedisService.setDiscounts(); // This is done asynchronously, so any discoutn queries will fail until this is back... but it's not a common call to make, so I don't want to block the entire server
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
 * File endpoints
 */
app.get('/admin/files/update', FileController.filesUpdate);
app.get('/admin/files', FileController.get);
app.post('/admin/files', FormController.flow); // Use formidable body parser... the Flow variety
app.post('/admin/files', FileController.post);
app.post('/admin/files/remove', FormController.body);
app.post('/admin/files/remove', FileController.remove);
app.get('/admin/files/resize', FileController.resize);

/*
 * Social
*/
app.get('/admin/instagram', SocialController.searchInstagram);

/*
 * Redis
*/
app.get('/admin/clear-cache', CacheController.clearPages);

/*
 * User
*/
app.get('/user/:uid/provider/:provider', UserController.get);

/*
 * Payment
 */
 app.get('/user/payment/token', PaymentController.getClientToken);
 app.post('/user/payment/:nonce/nonce', PaymentController.createPaymentMethod);
 app.delete('/user/payment/:token/token', PaymentController.deletePaymentMethod);

/*
 * Checkout
 */
app.post('/user/checkout', FormController.body);
app.post('/user/checkout', CheckoutController.checkout);
app.post('/admin/transaction/:key/email', TransactionController.email);

app.post('/admin/transaction/:key/charge', FormController.body);
app.post('/admin/transaction/:key/charge', TransactionController.charge);

/*
 * Subscription
 */
app.get('/user/:userId/subscription/:subscriptionKey/pages', SubscriptionController.pages);
app.get('/user/:userId/subscription/:subscriptionKey/assignments', SubscriptionController.assignments);

/*
 * Messages
 */
app.post('/user/:userId/assignment/:assignmentKey/log/*', FormController.body);
app.post('/user/:userId/assignment/:assignmentKey/log/:type', MessageController.log);

app.post('/user/:userId/assignment/:assignmentKey/upload', FormController.flow); // Use formidable body parser... the Flow variety
app.post('/user/:userId/assignment/:assignmentKey/upload', MessageController.upload);

app.post('/user/:userId/upload/remove', FormController.body);
app.post('/user/:userId/upload/remove', MessageController.remove);

app.post('/user/:userId/recipient/:recipientId/send', FormController.body);
app.post('/user/:userId/recipient/:recipientId/send', MessageController.send);

app.post('/admin/user/:userId/assignment/:assignmentKey/queue-feedback-email', MessageController.queueFeedbackEmail);

app.post('/admin/email/:emailKey/send', FormController.body);
app.post('/admin/email/:emailKey/send', MessageController.sendQueuedEmail);

app.post('/admin/email/send/feedback', MessageController.sendQueuedFeedback);

/*
 * Shipment
 */
app.post('/admin/shipment/*', FormController.body);
app.post('/admin/shipment/address/create', ShipmentController.createAddress);
app.post('/admin/shipment/create', ShipmentController.createShipment);
app.post('/admin/shipment/:shipmentKey/quote/:quoteId/rate/:rateId/buy', ShipmentController.buyShipment);
app.post('/admin/shipment/:shipmentKey/label/:labelKey/refund', ShipmentController.refundShipment);
app.post('/admin/shipment/:shipmentKey/label/:labelKey/tracking', ShipmentController.updateTracking);

/*
 * Cron
 */
 CronService.resources();
 CronService.feedbackEmail();

/*
 * Finish this sucka up
*/
LogService.info("Serving on port " + ConfigService.get('private.cms.port'));
app.listen(ConfigService.get('private.cms.port'));