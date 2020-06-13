const path = require('path');

var fs = require('fs');
var nodeModules = {};
fs.readdirSync('node_modules').filter(function(x) {
	return ['.bin'].indexOf(x) === -1;
}).forEach(function(mod) {
	nodeModules[mod] = 'commonjs ' + mod;
});

module.exports = {
	devtool: 'source-map',
	mode: 'production',
	entry: { api: './src/app.ts' },
	resolve: { extensions: ['.js', '.ts'] },
	target: 'node',
	externals: nodeModules,
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js'
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: 'ts-loader', exclude: '/src/test/' }
		]
	}
};
