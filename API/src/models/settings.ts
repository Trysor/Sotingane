import { Document, model, Schema } from 'mongoose';

/*
 |--------------------------------------------------------------------------
 | Settings schema
 |--------------------------------------------------------------------------
*/



const schema = new Schema({
	org: { type: String, required: true },
	meta: {
		title: { type: String, required: true },
		desc: { type: String, required: true },
	},
	footer: {
		text: { type: String, required: true },
		copyright: { type: String, required: true },
	}
});

export interface Settings {
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

export interface SettingsDoc extends Settings, Document { }
export let SettingsModel = model<SettingsDoc>('Setting', schema);
