"use strict";
const paths = require("./config.js").path_func;
const getWebpackConfig = require("./webpack.config.js");


module.exports = function (grunt) {
	require("load-grunt-tasks")(grunt);
	const devConfig = getWebpackConfig({ mode: "development", type: "devserver" });
	const prodConfig = getWebpackConfig({ mode: "production" });

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		keepalive: true,
		clean: {
			deploy: paths.deployPath,
			webappDeploy: paths.webappDeployPath,
			testOntology: paths.deployPath + "/data/benchmark.json",
			redundantFolders: "pkg"
		},
		htmlbuild: {
			options: {
				beautify: true,
				relative: true,
				data: {
					// Data to pass to templates
					version: "<%= pkg.version %>"
				}
			},
			dev: {
				src: `${paths.srcPath}/index.html`,
				dest: paths.deployPath
			},
			prod: {
				// required for removing the benchmark ontology from the selection menu
				src: `${paths.srcPath}/index.html`,
				dest: paths.deployPath
			}
		},
		replace: {
			options: {
				patterns: [
					{
						match: "WEBVOWL_VERSION",
						replacement: "<%= pkg.version %>"
					}
				]
			},
			dist: {
				files: [
					{ expand: true, cwd: `${paths.deployPath}/js/`, src: "webvowl*.js", dest: "." }
				]
			}
		},
		webpack: {
			prod: prodConfig,
			dev: devConfig
		},
		watch: {}
	});
	grunt.registerTask("default", ["prod"]);
	grunt.registerTask("pre-js", ["clean:deploy"]);
	grunt.registerTask("post-js", ["replace", "clean:redundantFolders"]);
	grunt.registerTask("development", ["pre-js", "webpack:dev", "post-js", "htmlbuild:dev"]);
	grunt.registerTask("production", ["pre-js", "webpack:prod", "post-js", "htmlbuild:prod", "clean:testOntology"]);
	grunt.registerTask("devserver", ["development", "server", "watch"]);
	grunt.registerTask('server', function () {
		const Webpack = require('webpack');
		const WebpackDevServer = require('webpack-dev-server');
		const compiler = Webpack(devConfig);
		const devServerOptions = { ...devConfig.devServer };
		const server = new WebpackDevServer(devServerOptions, compiler);
		const runServer = async () => {
			console.log('Starting server...');
			await server.start();
		};
		runServer();
	});
};
