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
                        "bower_components/jquery/dist/jquery.min.js"
                    ]
                }

            }
        },
        'ftp-deploy': {
            build: {
                auth: {
                    host: '77.222.40.121',
                    port: 21
                },
                src: 'upload',
                dest: '/patgod/public_html/graph/',
                exclusions: []
            }
        },
        clean: [
            "upload"
        ],
        copy: {
            main: {
                files: [
                    {expand: true, src: ['example/*'], dest: 'upload/', filter: 'isFile'},
                    {expand: true, src: ['build/*'], dest: 'upload/', filter: 'isFile'}
                ]
            }
        }
    });


    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-ftp-deploy');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    grunt.registerTask('default', ['jasmine', 'uglify']);

    grunt.registerTask('deploy', ['clean', 'copy', 'ftp-deploy'])
};