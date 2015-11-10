'use strict';

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        watch: {
            options: {
                livereload: {
                    port: 9901
                }
            },
            style: {
                files: ['static/styles/**/*.scss', '../../app/styles/material/*.scss'],
                tasks: ['compass']
            },
            scripts: {
                files: 'static/scripts/**/*.js'
            },
            html: {
                files: ['views/*.handlebars', 'views/**/*.handlebars'],
                tasks: ['compass']
            }
        },

        compass: {
            options: {
                sassDir: 'static/styles',
                cssDir: 'static/styles',
                javascriptsDir: 'static/scripts',
                importPath: 'static/lib'
            },
            dist: {
                options: {}
            }
        },
        concat: {
            js: {
                src: [
                    'static/lib/rainbow/js/rainbow.min.js',
                    'static/lib/jquery/dist/jquery.min.js',
                    'static/lib/jquery.finger/dist/jquery.finger.min.js',
                    'static/lib/angular/angular.min.js',
                    'static/lib/angular-animate/angular-animate.min.js',
                    'static/lib/angular-aria/angular-aria.min.js',
                    'static/lib/angular-material/angular-material.min.js',
                    'static/lib/ngstorage/ngStorage.min.js',
                    'static/lib/moment/min/moment.min.js',
                    'static/lib/underscore/underscore-min.js',
                    'static/lib/angular-notifications/notification.js',
                    'static/lib/firebase/firebase.js',
                    'static/lib/angularfire/dist/angularfire.min.js',
                    'static/lib/angular-ui-router/release/angular-ui-router.min.js',
                    'static/lib/quiver-angular-utilities/utilities.js',
                    'static/lib/angularfire-authentication/angularfire-authentication.js',
                    'static/lib/angular-md5/angular-md5.min.js',
                    'static/lib/angular-google-analytics/dist/angular-google-analytics.min.js'
                ],
                dest: 'static/scripts/vendor.js'
            }
        },
        cssmin: {
            dist: {
                files: {
                    'static/styles/all-style.min.css': [
                        'static/lib/angular-material/angular-material.css',
                        'static/lib/rainbow/themes/github.css',
                        'static/styles/style.css'
                    ]
                }
            }
        }

    });

    grunt.registerTask('build', [
        'compass',
        'concat',
        'cssmin'
    ]);

};