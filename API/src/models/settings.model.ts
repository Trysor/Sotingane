import { Document, model, Schema } from 'mongoose';
import { Settings } from '../../types';

// ---------------------------------------
// ----------- SETTINGS SCHEMA -----------
// ---------------------------------------

const schema = new Schema({
	indexRoute: { type: String, required: true },
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


export interface SettingsDoc extends Settings, Document { }
export let SettingsModel = model<SettingsDoc>('Setting', schema);
