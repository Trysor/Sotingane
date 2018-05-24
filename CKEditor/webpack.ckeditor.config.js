const path = require('path');
const webpack = require('webpack');

const { styles } = require('@ckeditor/ckeditor5-dev-utils');

// Plugins
const CKEditorWebpackPlugin = require('@ckeditor/ckeditor5-dev-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const WrapperPlugin = require('wrapper-webpack-plugin');

module.exports = {
	devtool: 'source-map',
	entry: { ckeditor: './ckeditor.ts' },
	resolve: { extensions: ['.js', '.ts'] },
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js',
		libraryTarget: 'umd',
		libraryExport: 'default',
		library: 'ClassicEditor'
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: 'ts-loader' },
			{
				// Or /ckeditor5-[^/]+\/theme\/icons\/[^/]+\.svg$/ if you want to limit this loader to CKEditor 5 icons only.
				test: /\.svg$/,
				use: ['raw-loader']
			},
			{
				// Or /ckeditor5-[^/]+\/theme\/[\w-/]+\.css$/ if you want to limit this loader to CKEditor 5 theme only.
				test: /\.css$/,
				use: [
					{
						loader: 'style-loader',
						options: { singleton: true }
					},
					{
						loader: 'postcss-loader',
						options: styles.getPostCssConfig({
							themeImporter: { themePath: require.resolve('@ckeditor/ckeditor5-theme-lark') },
							minify: true
						})
					}
				]
			}
		]
	},
	plugins: [
		new CKEditorWebpackPlugin({ language: 'en' }),
		new MinifyPlugin({}, { comments: false }),
		new webpack.optimize.ModuleConcatenationPlugin(),
		new WrapperPlugin({ // Used because of SSR. Hackish solution
			test: /\.js$/, header: 'if("undefined"!==typeof navigator){', footer: '}else{module.exports=void 0}'
		})
	]
};