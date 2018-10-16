
export interface AppSettings {
	org: string;
	meta: {
		title: string;
		desc: string;
	};
	footer: {
		text: string;
		copyright: string;
	};
}

export interface ThemeSettings {
	'--app-prim-1': string;
	'--app-prim-2': string;
	'--app-prim-3': string;
	'--app-prim-c-1': string;
	'--app-prim-c-2': string;
	'--app-prim-c-3': string;

	'--app-acc-1': string;
	'--app-acc-2': string;
	'--app-acc-3': string;
	'--app-acc-c-1': string;
	'--app-acc-c-2': string;
	'--app-acc-c-3': string;

	'--color-text': string;

	'--color-background': string;
	'--color-header': string;
	'--color-sidepanel': string;
	'--color-material': string;
	'--color-content': string;
	'--color-shade': string;
	'--color-active': string;
	'--color-overlay': string;
	'--color-border': string;
	'--color-disabled': string;

	'--border': string;
	'--shadow': string;

	'--width-wrapper': string;
	'--width-side': string;
	'--width-max-field': string;
	'--height-header': string;
}
