import { FileURLPayload, FileUploadResult } from '.';

export interface CKEditorDefaultConfig {
	toolbar: {
		viewportTopOffset?: number;
		items: (CKEToolbarItems | CKEToolbarItemSpacer)[];
	};
	image?: {
		toolbar: CKEImagePluginToolbar[];
		styles: { name: string; icon: string; className?: string; isDefault?: boolean; title?: string }[];
	};
	mediaEmbed?: {
		previewsInData?: boolean;
		toolbar: CKEMediaEmbedPluginToolbar[];
		styles: { name: string; icon: string; }[];
		removeProviders?: CKEMediaEmbedProviders[];
		extraProviders?: string[];
	};
	table?: {
		contentToolbar: CKETablePluginToolbar[];
	};
	language: string;
}

type CKEImagePluginToolbar = 'imageTextAlternative' | '|' | string;
type CKEMediaEmbedPluginToolbar = 'imageTextAlternative' | '|' | 'imageStyle:alignLeft' | 'imageStyle:full' | 'imageStyle:alignRight';
type CKEMediaEmbedProviders =
	'dailymotion' | 'spotify' | 'youtube' | 'vimeo' | 'instagram'
	| 'twitter' | 'googleMaps' | 'flickr' | 'facebook';

type CKETablePluginToolbar = 'tableColumn' | 'tableRow' | 'mergeTableCells';


type CKEToolbarItems =
	'heading' | 'bold' | 'italic' | 'link' | 'bulletedList' | 'numberedList' | 'removeFormat'
	| 'fontSize' | 'fontFamily' | 'fontSize' | 'fontColor'
	| 'alignment' | 'blockQuote' | 'code' | 'codeBlock' | 'imageUpload' | 'mediaEmbed' | 'insertTable' | 'undo' | 'redo'
	| 'FileStore';

type CKEToolbarItemSpacer = '|';




export interface CKECustomUploadAdapterOptions {
	fileUploader: (file: File, updateProgressCallback: CKEUpdateProgressCallback) => CKEFileUploaderReturnValue;
}

interface CKEFileUploaderReturnValue {
	promise: Promise<FileUploadResult>;
	cancelFunc: () => void;
}

type CKEUpdateProgressCallback = (total: number, uploaded: number) => void;

export interface CKEFileStoreOptions {
	openGUI: () => Promise<FileURLPayload>;
}

