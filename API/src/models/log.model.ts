import { Document, model, Schema } from 'mongoose';
import { Log } from '../../types';

// ---------------------------------------
// ------------- LOG SCHEMA --------------
// ---------------------------------------

const schema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
	route: { type: String, required: true, index: true },
	content: { type: Schema.Types.ObjectId, ref: 'Content', required: false },
	browser: { type: String, required: false },
	browser_ver: { type: String, required: false },
	ts: { type: Date, default: Date.now, required: true },
});

export interface LogDoc extends Log, Document { }
export const LogModel = model<LogDoc>('Log', schema);
