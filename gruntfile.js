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
      html: {
        files: {
          'public/temp': ['src/jade/**/*.jade']
        },
        options: {
          client: false,
          pretty: true
        }
      }
    },
    concat: {
      dist: {
        src: ['src/js/**/main.js', 'src/js/**/resources/*.js','src/js/**/*.js'],
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

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['sass']);
};
