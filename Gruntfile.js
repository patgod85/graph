//Стандартный экспорт модуля в nodejs
module.exports = function(grunt) {
    // Инициализация конфига GruntJS
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        jasmine: {
            pivotal: {
                src: 'src/**/*.js',
                options: {
                    specs: 'spec/*Spec.js',
                    vendor: [
                        "http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"
                        //"bower_components/jquery/dist/jquery.min.js"
                    ]
                }

            }
        }
    });


    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Default task(s).
    grunt.registerTask('default', ['jasmine', 'uglify']);
};