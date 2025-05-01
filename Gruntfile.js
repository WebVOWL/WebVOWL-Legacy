"use strict"
const paths = require("./paths.js").path_func
const getWebpackConfig = require("./webpack.config.js")

module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt)
    const devConfig = getWebpackConfig({
        mode: "development",
        type: "devserver",
    })
    const prodConfig = getWebpackConfig({ mode: "production" })

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        keepalive: true,
        clean: {
            deploy: paths.deployPath,
            webappDeploy: paths.webappDeployPath,
            testOntology: paths.deployPath + "/data/benchmark.json",
        },
        htmlbuild: {
            options: {
                beautify: true,
                relative: true,
                data: {
                    // Data to pass to templates
                    version: "<%= pkg.version %>",
                },
            },
            dev: {
                src: `${paths.srcPath}/index.html`,
                dest: paths.deployPath,
            },
            prod: {
                src: `${paths.srcPath}/index.html`,
                dest: paths.deployPath,
            },
        },
        webpack: {
            prod: prodConfig,
            dev: devConfig,
        },
        watch: {},
    })
    grunt.registerTask("default", ["prod"])
    grunt.registerTask("pre-js", ["clean:deploy"])
    grunt.registerTask("development", [
        "pre-js",
        "webpack:dev",
        "htmlbuild:dev",
    ])
    grunt.registerTask("production", [
        "pre-js",
        "webpack:prod",
        "htmlbuild:prod",
        "clean:testOntology",
    ])
    grunt.registerTask("devserver", [
        "pre-js",
        "htmlbuild:dev",
        "server",
        "watch",
    ])
    grunt.registerTask("server", () => {
        const Webpack = require("webpack")
        const WebpackDevServer = require("webpack-dev-server")
        const compiler = Webpack(devConfig)
        const devServerOptions = { ...devConfig.devServer }
        const server = new WebpackDevServer(devServerOptions, compiler)
        const runServer = async () => {
            console.log("Starting server...")
            await server.start()
        }
        runServer()
    })
}
