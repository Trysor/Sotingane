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

// Features
import LinkPlugin from '@ckeditor/ckeditor5-link/src/link';
import ListPlugin from '@ckeditor/ckeditor5-list/src/list';
import BlockquotePlugin from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import CodePlugin from '@ckeditor/ckeditor5-basic-styles/src/code';

export default class ClassicEditor extends ClassicEditorBase {
	static defaultConfig: { toolbar: { items: string[]; }; image?: { toolbar: string[]; styles: { name: string; icon: string; }[]; }; language: string; };
	static builtinPlugins: any[];
	static create: (e?: HTMLElement) => Promise<any>
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
	LinkPlugin,
	ListPlugin,
	BlockquotePlugin,
	CodePlugin
];
ClassicEditor.defaultConfig = {
	toolbar: {
		items: [
			'heading',
			'|',
			'bold', 'italic', 'link',
			'|',
			'bulletedList', 'numberedList', 'alignment',
			'|',
			'blockQuote', 'code',
			'|',
			'undo', 'redo'
		]
	},

	language: 'en'
};
