import { Document, model, Model, Schema } from 'mongoose';
import { NextFunction } from 'express';
import { accessRoles } from '../models/user';

/*
 |--------------------------------------------------------------------------
 | Content schema
 |--------------------------------------------------------------------------
*/


const schema = new Schema({
	current: {
		title: { type: String, unique: true, required: true },
		access: { type: String, enum: ['admin', 'user', 'everyone'], default: 'everyone', index: true },
		route: { type: String, required: true, unique: true, index: { unique: true } },
		published: { type: Boolean, default: true },
		version: { type: Number, required: true },

		content: { type: String, required: true },
		content_searchable: { type: String, required: true },

		description: { type: String },
		images: [{ type: String }],

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


export interface ContentDoc extends Document {
	current: Content;
	prev: Content[];

	views: number;

	updatedAt?: Date;
	createdAt?: Date;
}

export interface Content {
	title: string;
	access?: accessRoles;
	route: string;
	published?: boolean;
	version?: number;

	views?: number;

	content?: string;
	content_searchable?: string;

	description?: string;
	images?: string[]; // url

	folder?: string;
	nav?: boolean;

	updatedBy?: Schema.Types.ObjectId;
	createdBy?: Schema.Types.ObjectId;

	updatedAt?: Date;
	createdAt?: Date;
}

export const ContentModel = model<ContentDoc>('Content', schema);
