"use strict";
const paths = require("./paths.js").path_func;
const path = require('path');
const webpack = require("webpack");
const MergeWebPackPlugin = require('webpack-merge');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

function getConfig(args) {
	const isProdEnabled = args.mode === "production" ? true : false;
	const modeLiteral = args.mode === "production" ? "production" : "development";
	return {
		cache: true,
		mode: modeLiteral,
		target: "web",
		devtool: args.mode === "production" ? false : "source-map",
		entry: {
			app: {
				import: [
					`./${paths.frontendPath}/js/entry.js`
				],
				dependOn: "webvowl"
			},
			webvowl: {
				import: [
					`./${paths.backendPath}/js/entry.js`
				],
			},
		},
		output: {
			path: path.resolve(__dirname, paths.deployPath),
			publicPath: 'auto',
			filename: "js/[name].js",
			chunkFilename: "js/[chunkhash].js",
			// webassemblyModuleFilename: 'wasm/[id].[hash].wasm',
			// enabledWasmLoadingTypes: ['fetch'],
			// workerChunkLoading: "universal",
			// globalObject: 'this',
			// module: true,
			library: {
				name: "[name]",
				type: 'umd',
			},
		},
		experiments: {
			// futureDefaults: true,
			// css: false,
			// outputModule: true,
			// asyncWebAssembly: true
		},
		optimization: {
			// splitChunks: {
			// 	chunks: 'all',
			// },
			// runtimeChunk: 'single',
			minimize: isProdEnabled,
			minimizer: [
				new TerserPlugin({
					minify: TerserPlugin.uglifyJsMinify,
					// `terserOptions` options will be passed to `uglify-js`
					// https://github.com/mishoo/UglifyJS#minify-options
					terserOptions: { sourceMap: isProdEnabled },
				}),
				new CssMinimizerPlugin()
			],
		},
		// resolve: {
		// 	// Webpack 5 polyfill https://webpack.js.org/configuration/resolve/#resolvefallback
		// 	fallback: {
		// 		// assert: require.resolve('assert'),
		// 		// buffer: require.resolve('buffer'),
		// 		// console: require.resolve('console-browserify'),
		// 		// constants: require.resolve('constants-browserify'),
		// 		// crypto: require.resolve('crypto-browserify'),
		// 		// domain: require.resolve('domain-browser'),
		// 		// events: require.resolve('events'),
		// 		// http: require.resolve('stream-http'),
		// 		// https: require.resolve('https-browserify'),
		// 		// os: require.resolve('os-browserify/browser'),
		// 		path: require.resolve('path-browserify'),
		// 		// fs: require.resolve('fs'),
		// 		// punycode: require.resolve('punycode'),
		// 		// process: require.resolve('process/browser'),
		// 		// querystring: require.resolve('querystring-es3'),
		// 		// stream: require.resolve('stream-browserify'),
		// 		// string_decoder: require.resolve('string_decoder'),
		// 		// sys: require.resolve('util'),
		// 		// timers: require.resolve('timers-browserify'),
		// 		// tty: require.resolve('tty-browserify'),
		// 		// url: require.resolve('url'),
		// 		util: require.resolve('util'),
		// 		vm: require.resolve('vm-browserify'),
		// 		// zlib: require.resolve('browserify-zlib'),
		// 	},
		// 	// alias: {
		// 	// 	process: "process/browser",
		// 	// },
		// },
		module: {
			rules: [
				{
					test: /\.css$/i,
					use: [
						MiniCssExtractPlugin.loader,
						"css-loader",
					],
				},
				{
					test: /\.m?js/,
					resolve: {
						fullySpecified: false,
					},
				}
			],
		},
		plugins: [
			new webpack.ProvidePlugin({
				d3: "d3"
			}),
			// new webpack.ProvidePlugin({
			// 	process: 'process/browser',
			// }),
			new CopyWebpackPlugin(
				{
					patterns: [
						{ context: paths.dataPath, from: "./*", to: `data` },
						{ context: paths.srcPath, from: "favicon.ico", to: "." },
						{ from: "license.txt", to: "." }
					]
				}
			),
			new MiniCssExtractPlugin({ filename: "css/[name].css" }),
			new WasmPackPlugin({
				crateDirectory: path.resolve(__dirname, paths.rustPath),
				// For available set of arguments check:
				// https://rustwasm.github.io/wasm-pack/book/commands/build.html
				// https://github.com/wasm-tool/wasm-pack-plugin
				args: '--verbose',
				extraArgs: '--no-typescript --target web --mode normal',
				forceMode: "production",
				outDir: path.resolve(__dirname, paths.pkgPath),
				pluginLogLevel: 'info'
			}),
		]
	};
};

function getServerConfig(args) {
	return {
		devServer: {
			host: "localhost",
			port: 8080,
			server: "http",
			compress: false,
			hot: false,
			open: true,
			setupExitSignals: true,
			// headers: {
			// 	"Cross-Origin-Resource-Policy": "cross-origin",
			// 	"Cross-Origin-Opener-Policy": "same-origin",
			// 	"Cross-Origin-Embedder-Policy": "require-corp"
			// },
			static: {
				directory: path.resolve(paths.deployPath)
			},
			client: {
				overlay: {
					errors: true,
					warnings: false,
					runtimeErrors: true,
				},
				logging: 'info',
				progress: true,
				reconnect: 3,
			},
			devMiddleware: {
				index: true,
				serverSideRender: false,
				writeToDisk: false,
				lastModified: true,
			},
		},
	};
};

module.exports = (args) => {
	switch (args.type) {
		case "devserver":
			return MergeWebPackPlugin.merge(getConfig(args), getServerConfig(args));
		default:
			return getConfig(args);
	}
};