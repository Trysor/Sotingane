import { Document, model, Schema } from 'mongoose';
import { File } from '../../types';

// ---------------------------------------
// ------------- FILE SCHEMA -------------
// ---------------------------------------

const schema = new Schema({
	data: { type: Buffer, required: true },
	uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	uploadedDate: { type: Date, default: Date.now, required: true },
	hash: { type: String, required: true, index: true },
	filename: { type: String, required: true, index: true },
	mimeType: { type: String, required: true },
	thumbnail: { type: Boolean, required: true },
});

export interface FileDoc extends File, Document { }
export let FileModel = model<FileDoc>('File', schema);
