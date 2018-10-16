import { Document, model, Schema } from 'mongoose';

/*
 |--------------------------------------------------------------------------
 | Theme schema
 |--------------------------------------------------------------------------
*/

const schema = new Schema({
	name: { type: String, required: true, index: true },
	vars: {
		'--app-prim-1': { type: String, required: true },
		'--app-prim-2': { type: String, required: true },
		'--app-prim-3': { type: String, required: true },
		'--app-prim-c-1': { type: String, required: true },
		'--app-prim-c-2': { type: String, required: true },
		'--app-prim-c-3': { type: String, required: true },

		'--app-acc-1': { type: String, required: true },
		'--app-acc-2': { type: String, required: true },
		'--app-acc-3': { type: String, required: true },
		'--app-acc-c-1': { type: String, required: true },
		'--app-acc-c-2': { type: String, required: true },
		'--app-acc-c-3': { type: String, required: true },

		'--color-text': { type: String, required: true },

		'--color-background': { type: String, required: true },
		'--color-header': { type: String, required: true },
		'--color-sidepanel': { type: String, required: true },
		'--color-material': { type: String, required: true },
		'--color-content': { type: String, required: true },
		'--color-shade': { type: String, required: true },
		'--color-active': { type: String, required: true },
		'--color-overlay': { type: String, required: true },
		'--color-border': { type: String, required: true },
		'--color-disabled': { type: String, required: true },

		'--border': { type: String, required: true },
		'--shadow': { type: String, required: true },

		'--width-wrapper': { type: String, required: true },
		'--width-side': { type: String, required: true },
		'--width-max-field': { type: String, required: true },
		'--height-header': { type: String, required: true },
	}
});

export interface Theme {
	name: string;
	vars: {
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
	};
}

export interface ThemeDoc extends Theme, Document { }
export let ThemeModel = model<ThemeDoc>('Theme', schema);
