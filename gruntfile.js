module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    sass: {
        options: {
            sourceMap: false
        },
        dist: {
            files: {
                'public/css/main.css': 'src/sass/main.scss'
            }
        }
    },
    jade: {
      compile: {
        options: {
          data: {
            debug: false
          },
          pretty: true
        },
        files:
          [{
            expand: true,
            flatten: false,
            cwd: 'src/jade/',
            src: ['*.jade', '**/*.jade'],
            dest: 'public',
            ext: '.html',
          }]
      }
    },
    concat: {
      dist: {
        src: ['src/js/**/main.js', 'src/js/**/resources/*.js', 'src/js/**/*.js'],
        dest: 'public/js/main.js',
      },
    },
    watch: {
      jade: {
        files: '**/*.jade',
        tasks: ['jade']
      },
      styles: {
        files: '**/*.scss',
        tasks: ['sass']
      },
      scripts: {
        files: 'src/**/*.js',
        tasks: ['concat']
      }
    }
  });

  grunt.registerTask('start_server', 'Start local server on localhost:1000', function(){
    var terminal = require("child_process").exec;
    terminal("php -S localhost:1000 -t public");
  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['sass']);
  grunt.registerTask('start', ['start_server','sass','jade','concat','watch']);
};
