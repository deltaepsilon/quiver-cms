// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'app/lib/angular/angular.js',
      'app/lib/angular-mocks/angular-mocks.js',
      'app/lib/lodash/dist/lodash.compat.js',
      'app/lib/moment/moment.js',
      'app/lib/angular-ui-router/release/angular-ui-router.js',
      'app/lib/angular-notifications/notification.js',
      'app/lib/mockfirebase/dist/mockfirebase.js',
      'app/lib/firebase/firebase-debug.js',
      'app/lib/angular-markdown-editable/angular-markdown-editable.js',
      'app/lib/angular-slugify/angular-slugify.js',
      'app/lib/restangular/dist/restangular.js',
      'app/lib/quiver-angular-utilities/utilities.js',
      'app/lib/angular-md5/angular-md5.js',
      'app/lib/ngstorage/ngStorage.js',
      'app/lib/flow.js/dist/flow.js',
      'app/lib/ng-flow/dist/ng-flow.js',
      'app/lib/angular-google-analytics/dist/angular-google-analytics.min.js',
      'app/lib/firebase-simple-login/firebase-simple-login.js',
      'app/lib/mockfirebase/dist/mockfirebase.js',
      'app/lib/angularfire/dist/angularfire.min.js',
      'app/scripts/*.js',
      'app/scripts/**/*.js',
      'test/mock/**/*.js',
      'test/spec/**/*.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
