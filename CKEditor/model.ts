
export interface CKEditorDefaultConfig {
	toolbar: {
		viewportTopOffset?: number;
		items: (CKEToolbarItems | CKEToolbarItemSpacer)[];
	};
	image?: {
		toolbar: CKEImagePluginToolbar[];
		styles: { name: string; icon: string; }[];
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
	}
	language: string;
}

type CKEImagePluginToolbar = 'imageTextAlternative' | '|' | 'imageStyle:alignLeft' | 'imageStyle:full' | 'imageStyle:alignRight';
type CKEMediaEmbedPluginToolbar = 'imageTextAlternative' | '|' | 'imageStyle:alignLeft' | 'imageStyle:full' | 'imageStyle:alignRight';
type CKEMediaEmbedProviders = 'dailymotion' | 'spotify' | 'youtube' | 'vimeo' | 'instagram' | 'twitter' | 'googleMaps' | 'flickr' | 'facebook';
type CKETablePluginToolbar = 'tableColumn' | 'tableRow' | 'mergeTableCells';


type CKEToolbarItems =
	'heading' | 'bold' | 'italic' | 'link' | 'bulletedList' | 'numberedList' | 'removeFormat' | 'fontSize' | 'fontFamily' | 'fontSize' | 'fontColor' |
	'alignment' | 'blockQuote' | 'code' | 'mediaEmbed' | 'insertTable' | 'undo' | 'redo';
type CKEToolbarItemSpacer = '|';
