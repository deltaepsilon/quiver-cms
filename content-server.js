var config = require('config'),
  express = require('express'),
  app = express(),
  Q = require('q'),
  fs = require('fs-extra'),
  Firebase = require('firebase'),
  firebaseEndpoint = config.get('public.firebase.endpoint'),
  firebaseRoot = new Firebase(firebaseEndpoint),
  firebaseSecret = config.get('private.firebase.secret'),
  winston = require('winston'),
  mime= require('mime'),
  moment = require('moment'),
  _ = require('underscore'),
  expressHandlebars = require('express-handlebars'),
  helpers = require('./lib/extensions/helpers.js')({bucket: config.get('public.amazon.publicBucket')}),
  Showdown = require('showdown'),
  mdConverter = new Showdown.converter(),
  ElasticSearchClient = require('elasticsearchclient'),
  elasticSearchClient = new ElasticSearchClient(config.get('private.elasticsearch')),
  elasticSearchIndex = config.get('private.elasticsearch.index'),
  Feed = require('feed'),
  handlebars,
  theme,
  words,
  products,
  settings,
  hashtags,
  wordsIndex,
  noop = function () {},
  setCache = noop,
  htmlDateFormat = "ddd, DD MMM YYYY HH:mm:ss";

/*
 * Services
 */
var LogService = require('./lib/services/log-service'),
  ObjectService = require('./lib/services/object-service'),
  RedisService = require('./lib/services/redis-service');

/*
 * Controllers
 */
var CacheController = require('./lib/controllers/cache'),
  EnvironmentController = require('./lib/controllers/environment'),
  FeedController = require('./lib/controllers/feed'),
  ProductController = require('./lib/controllers/product'),
  PageController = require('./lib/controllers/page'),
  StaticController = require('.lib/controllers/static');

/*
 * Templating
*/
app.set('view engine', 'handlebars');

/*
 * Redis
*/
app.use(CacheController.pages);


/*
 * Env.js
*/
app.get('/env.js', EnvironmentController.envJS);

/*
 * Static
*/
app.use('/static', StaticController.content);

/*
 * Atom 1.0 and RSS 2.0
 */
app.get('/atom', FeedController.atom);
app.get('/rss', FeedController.rss);


/*
 * Product
*/
app.get('/products', ProductController.products);
app.get('/product/:slug', ProductController.product);


/*
 * Posts
*/
app.get('/', PageController.frontPage);


app.get('/posts/:page', PageController.posts);

app.get('/:slug', PageController.page);

app.get('/search/:searchTerm', function (req, res) {
  var deferred = Q.defer(),
    searchTerm = req.params.searchTerm;

  elasticSearchClient.search(elasticSearchIndex, "word", {"query": {"query_string": {"query": searchTerm}}}, function (err, data) {
    return err ? deferred.reject(err) : deferred.resolve(JSON.parse(data));
  });

  deferred.promise.then(function (data) {
    var hits = data.hits.hits,
      posts = [];

    _.each(hits, function (hit) {
      posts.push(hit._source);
    });

    app.render('posts', {
      development: config.get('public.environment') === 'development',
      title: "Search: " + searchTerm,
      posts: posts,
      settings: settings,
      url: req.url
    }, function (err, html) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(html);
        setCache(req.url, html);

      }
    });


  });
});

/*
 * Email
 */

app.get('/transaction/:key/email/:type', function (req, res) {
  var key = req.params.key,
    layout = req.params.type === 'html' ? 'email-html'  : 'email-txt',
    view = req.params.type === 'html' ? 'email-transaction-html' : 'email-transaction-txt',
    transactionRef = firebaseRoot.child('logs').child('transactions').child(key),
    transactionDeferred = Q.defer(),
    userRef,
    userDeferred = Q.defer();

  transactionRef.once('value', function (snapshot) {
    return transactionDeferred.resolve(snapshot.val());
  });

  transactionDeferred.promise.then(function (transaction) {
    userRef = firebaseRoot.child('users').child(transaction.userId);
    userRef.once('value', function (snapshot) {
      return userDeferred.resolve(snapshot.val());
    });
  });

  Q.all([transactionDeferred.promise, userDeferred.promise]).spread(function (transaction, user) {
    app.render(view, {
        layout: layout,
        user: user,
        key: key,
        transaction: transaction,
        email: config.get('private.email'),
        configPublic: config.get('public'),
        settings: settings
      }, function (err, content) {
        return err ? res.status(500).send(err) : res.status(200).send(content);   
      });  
  });
  
});


/*
 * Index Words and Search
*/
var createWordsIndex = function (words) {
    var deferred = Q.defer(),
      wordsIndexRef = firebaseRoot.child('wordsIndex'),
      index = {};

    _.each(words, function (word) {
      if (word.type !== 'subscription') {
        index[word.slug] = word.key;
      }

    });

    wordsIndexRef.set(index, function (err) {
      return err ? deferred.reject(err) : deferred.resolve();
    });

    return deferred.promise;
  },
  createSearchIndex = function (words) {
    var deferred = Q.defer(),
      deleteDeferred = Q.defer(),
      commands = [];

    elasticSearchClient.deleteByQuery(elasticSearchIndex, "word", {"match_all": {}}, function (err, data) {
      return err ? deleteDeferred.reject(err) : deleteDeferred.resolve(data);
    });


    deleteDeferred.promise.then(function () {
      _.each(words, function (word, key) {
        if (word.type !== 'subscription') {
          if (word.keyImage && !word.keyImage.Versions) {
            word.keyImage.Versions = {}; // This prevents a mapping error in elasticsearch. It doesn't like "keyImage.Versions: false"
          }
          commands.push({"index": {"_index": elasticSearchIndex, "_type": "word"}});
          commands.push(word);
        }

      });

      elasticSearchClient.bulk(commands, {})
        .on('data', function (data) {
//          var commands = JSON.parse(data);
//          _.each(commands, console.log);
        })
        .on('done', deferred.resolve)
        .on('error', deferred.reject)
        .exec();
    }, function (err) {
      LogService.error('elasticsearch delete', err);
    });

    return deferred.promise;
  };

app.get('/delete', function (req, res) {

});

/*
 * Auth & App Listen
*/
console.log('...Starting auth...');
firebaseRoot.auth(firebaseSecret, function () {
  var themeRef = firebaseRoot.child('theme'),
    wordsRef = firebaseRoot.child('content').child('words'),
    productsRef = firebaseRoot.child('content').child('products'),
    settingsRef = firebaseRoot.child('settings'),
    hashtagsRef = firebaseRoot.child('content').child('hashtags'),
    wordsIndexRef = firebaseRoot.child('wordsIndex'),
    themeDeferred = Q.defer(),
    wordsDeferred = Q.defer(),
    productsDeferred = Q.defer(),
    settingsDeferred = Q.defer(),
    hashtagsDeferred = Q.defer(),
    wordsIndexDeferred = Q.defer();

  themeRef.on('value', function (snapshot) {
    var viewsDir;

    theme = snapshot.val();

    theme.active = theme.options[theme.active || Object.keys(theme.options)[0]];

    viewsDir = './themes/' + theme.active + '/views';

    handlebars = expressHandlebars.create({
      defaultLayout: 'main',
      layoutsDir: viewsDir + '/layouts',
      partialsDir: viewsDir + '/partials',
      helpers: helpers
    });

    app.engine('html', handlebars.engine);
    app.engine('handlebars', handlebars.engine);

    app.set('views', viewsDir);

    themeDeferred.resolve(theme);

  });

  var handleWords = function (snapshot) {
    var result = [];

    snapshot.forEach(function (wordSnapshot) {
      var word = wordSnapshot.val();
      word.key = wordSnapshot.name();
      result.push(word);
    });

    words = _.sortBy(result, function (word) { // Sort by reverse word.created
      return 1 * moment(word.created).unix();
    });

    Q.all([createWordsIndex(words), createSearchIndex(words)]).then(wordsDeferred.resolve, wordsDeferred.reject);

  };

  wordsRef.on('value', handleWords);


  productsRef.on('value', function (snapshot) {
    products = snapshot.val();
    productsDeferred.resolve(products);
  });

  settingsRef.on('value', function (snapshot) {
    var stringChecks =  ['nav1Title', 'nav2Title', 'nav3Title'];
    settings = snapshot.val();

    _.each(stringChecks, function (check) {
      var value = settings[check];
      if (typeof value === 'string' && !value.length) {
        settings[check] = false;
      }
    });

    settingsDeferred.resolve(settings);
  });

  hashtagsRef.on('value', function (snapshot) {
    hashtags = snapshot.val();
    hashtagsDeferred.resolve(settings);
  });

  wordsIndexRef.on('value', function (snapshot) {
    wordsIndex = snapshot.val();
    wordsIndexDeferred.resolve(wordsIndex);
  });


  Q.all([
    themeDeferred.promise,
    wordsDeferred.promise,
    productsDeferred.promise,
    settingsDeferred.promise,
    hashtagsDeferred.promise,
    wordsIndexDeferred.promise
  ]).then(function () {
    LogService.info('Serving on port ' + config.get('private.content.port'));
    app.listen(config.get('private.content.port'));
  }, function (err) {
    LogService.error('App not listening', err);
  });


});
