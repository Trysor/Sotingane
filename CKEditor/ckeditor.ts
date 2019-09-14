import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials';

// Text manipulation
import AlignmentPlugin from '@ckeditor/ckeditor5-alignment/src/alignment';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import ItalicPlugin from '@ckeditor/ckeditor5-basic-styles/src/italic';
import HeadingPlugin from '@ckeditor/ckeditor5-heading/src/heading';
import ParagraphPlugin from '@ckeditor/ckeditor5-paragraph/src/paragraph';

// Image
import ImagePlugin from '@ckeditor/ckeditor5-image/src/image';
import ImagecaptionPlugin from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImagestylePlugin from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImagetoolbarPlugin from '@ckeditor/ckeditor5-image/src/imagetoolbar';

// Upload
import ImageUploadPlugin from '@ckeditor/ckeditor5-image/src/imageupload';
import CustomUploadAdapter from './plugins/customUploadAdapter/customUploadAdapter';

// Features
import LinkPlugin from '@ckeditor/ckeditor5-link/src/link';
import ListPlugin from '@ckeditor/ckeditor5-list/src/list';
import BlockquotePlugin from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import CodePlugin from '@ckeditor/ckeditor5-basic-styles/src/code';
import MediaEmbedPlugin from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import TablePlugin from '@ckeditor/ckeditor5-table/src/table';
import TableToolbarPlugin from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import RemoveFormatPlugin from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import FontPlugin from '@ckeditor/ckeditor5-font/src/font';
import WordCountPlugin from '@ckeditor/ckeditor5-word-count/src/wordcount';

// Typings
import { CKEditorDefaultConfig } from './model';

export default class ClassicEditor extends ClassicEditorBase {
	static defaultConfig: CKEditorDefaultConfig;
	static builtinPlugins: any[];
	static create: (e?: HTMLElement) => Promise<any>;
}

ClassicEditor.builtinPlugins = [
	EssentialsPlugin,
	AlignmentPlugin,
	BoldPlugin,
	ItalicPlugin,
	HeadingPlugin,
	ParagraphPlugin,
	ImagePlugin,
	ImagecaptionPlugin,
	ImagestylePlugin,
	ImagetoolbarPlugin,
	ImageUploadPlugin,
	CustomUploadAdapter,
	LinkPlugin,
	ListPlugin,
	BlockquotePlugin,
	CodePlugin,
	MediaEmbedPlugin,
	TablePlugin,
	TableToolbarPlugin,
	RemoveFormatPlugin,
	FontPlugin,
	WordCountPlugin
];
ClassicEditor.defaultConfig = {
	toolbar: {
		viewportTopOffset: 40,
		items: [
			'heading',
			'|',
			'bold', 'italic', 'fontColor', 'removeFormat',
			'|',
			'link',
			'|',
			'bulletedList', 'numberedList', 'alignment',
			'|',
			'blockQuote', 'code',
			'|',
			'imageUpload', 'mediaEmbed', 'insertTable',
			'|',
			'undo', 'redo'
		]
	},

	mediaEmbed: {
		previewsInData: false,
		toolbar: ['imageTextAlternative', '|', 'imageStyle:alignLeft', 'imageStyle:full', 'imageStyle:alignRight'],
		styles: [
			{ name: 'alignLeft', icon: 'left' },
			{ name: 'full', icon: 'full' },
			{ name: 'alignRight', icon: 'right' },
		],
		removeProviders: [ 'instagram', 'twitter', 'googleMaps', 'flickr', 'facebook' ]
	},

	image: {
		toolbar: ['imageTextAlternative', '|', 'imageStyle:alignLeft', 'imageStyle:full', 'imageStyle:alignRight'],
		styles: [
			{ name: 'alignLeft', icon: 'left' },
			{ name: 'full', icon: 'full' },
			{ name: 'alignRight', icon: 'right' },
		]
	},

	table: {
		contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
	},

	language: 'en'
};
