import { Document, model, Schema } from 'mongoose';
import { FileData } from '../../types';

// ---------------------------------------
// ------------- FILE SCHEMA -------------
// ---------------------------------------

const schema = new Schema({
	data: {
		type: Map,
		of: Buffer
	},
	title: { type: String, required: true, maxlength: 50 },
	uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	uploadedDate: { type: Date, default: Date.now, required: true },
	hash: { type: String, required: true },
	uuid: { type: String, required: true, index: true },
	mimeType: { type: String, required: true },
});

export interface FileDoc extends FileData, Document { }
export const FileModel = model<FileDoc>('File', schema);
