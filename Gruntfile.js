module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
      ' Licensed under the <%= pkg.license %> license. */\n',
    // Task configuration.
    coffee: {
      compile: {
        files: {
          'src/js/background.js': ['src/coffee/background.coffee']
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        mangle: {
          except: ['jQuery']
        },
        compress: true
      },
      dist: {
        files: {
          'src/js/background.min.js': ['src/js/background.js']
        }
      }
    },
    manifest: grunt.file.readJSON('src/manifest.json'),
    crx: {
      production: {
        "src": "src/",
        "dest": "dist/",
        "baseURL": "https://raw.github.com/castor4bit/SnoozeTab/master/dist/SnoozeTab/",
        "exclude": [".git", "*.swp", "coffee/*"],
        "privateKey": "/Users/castor/.ssh/chrome-extension.pem"
      }
    },
    watch: {
      coffee: {
        files: ['src/coffee/**/*.coffee'],
        tasks: ['coffee']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-crx');

  // Default task.
  grunt.registerTask('default', ['coffee', 'uglify', 'crx']);

};
