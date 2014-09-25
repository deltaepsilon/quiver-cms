'use strict';

module.exports = function (grunt) {

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
        files: 'static/styles/**/*.scss',
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
    }
  });

};