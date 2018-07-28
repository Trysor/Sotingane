import { Document, model, Schema } from 'mongoose';
import { User } from '../models/user';
import { ContentDoc } from '../models/content';

/*
 |--------------------------------------------------------------------------
 | Log schema
 |--------------------------------------------------------------------------
*/



const schema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
	route: { type: String, required: true, index: true },
	content: { type: Schema.Types.ObjectId, ref: 'Content', required: false },
	browser: { type: String, required: false },
	browser_ver: { type: String, required: false },
	ts: { type: Date, default: Date.now, required: true },
});

export interface Log extends Document {
	user?: User;
	route: string;
	content: ContentDoc;
	browser?: string;
	browser_ver?: string;
	ts: Date;
}

export let LogModel = model<Log>('Log', schema);
