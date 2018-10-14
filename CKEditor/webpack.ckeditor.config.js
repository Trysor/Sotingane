const path = require('path');
const { styles } = require('@ckeditor/ckeditor5-dev-utils');
const CKEditorWebpackPlugin = require('@ckeditor/ckeditor5-dev-webpack-plugin');
const WrapperPlugin = require('wrapper-webpack-plugin');
const UglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	devtool: 'source-map',
	performance: { hints: false },
	mode: 'production',

	entry: { ckeditor: './ckeditor.ts' },
	resolve: { extensions: ['.js', '.ts'] },
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js',
		libraryTarget: 'umd',
		libraryExport: 'default',
		library: 'ClassicEditor',
		umdNamedDefine: true
	},

	optimization: { // Preserve CKEditor 5 license comments.
		minimizer: [ new UglifyJsWebpackPlugin({ sourceMap: true, parallel: true, cache: true, uglifyOptions: { output: { comments: /^!/ } }  }) ]
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: 'ts-loader' },
			{ test: /\.svg$/, use: ['raw-loader'] },
			{
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
					},
				]
			}
		]
	},
	plugins: [
		new CKEditorWebpackPlugin({ language: 'en' }),
		new WrapperPlugin({ // Used because of SSR. Hackish solution
			test: /\.js$/, header: 'if("undefined"!==typeof navigator){', footer: '}else{module.exports=void 0}'
		})
	]
};