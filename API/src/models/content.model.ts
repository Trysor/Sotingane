import { Document, model, Schema } from 'mongoose';
import { AccessRoles, ContentEntry } from '../../types';

// ---------------------------------------
// ----------- CONTENT SCHEMA ------------
// ---------------------------------------

const schema = new Schema({
	current: {
		title: { type: String, unique: true, required: true },
		access: [{ type: String, enum: Object.values(AccessRoles) }],
		route: { type: String, required: true, unique: true, index: { unique: true } },
		published: { type: Boolean, default: true },
		version: { type: Number, required: true },

		content: { type: String, required: true },
		content_searchable: { type: String, required: true },

		description: { type: String },
		images: [{
			width: { type: Number },
			height: { type: Number },
			type: { type: String },
			url: { type: String }
		}],

		folder: { type: String },
		nav: { type: Boolean, default: false },

		updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

		updatedAt: { type: Date, default: Date.now },
		createdAt: { type: Date, default: Date.now },
	},

	prev: []
},
{
	timestamps: true
});

// Searchable compound index
schema.index(
	{ 'current.title': 'text', 'current.content_searchable': 'text', 'current.description': 'text' },
	{ weights: { 'current.title': 3, 'current.content_searchable': 1, 'current.description': 2 } }
);

interface ContentDoc extends ContentEntry, Document { }
export const ContentModel = model<ContentDoc>('Content', schema);
