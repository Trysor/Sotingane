import { Document, model, Model, Schema } from 'mongoose';
import { NextFunction } from 'express';
import { ajv, JSchema } from '../libs/validate';
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
		version: { type: Number, required: true },

		content: { type: String, required: true },
		content_searchable: { type: String, required: true },

		description: { type: String },
		image: { type: String }, // url

		folder: { type: String },
		nav: { type: Boolean, default: false },

		updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

		updatedAt: { type: Date, default: Date.now },
		createdAt: { type: Date, default: Date.now },
	},

	views: { type: Number, required: true, default: 0 },
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
	version?: number;

	views?: number;

	content?: string;
	content_searchable?: string;

	description?: string;
	image?: string; // url

	folder?: string;
	nav?: boolean;

	updatedBy?: Schema.Types.ObjectId;
	createdBy?: Schema.Types.ObjectId;

	updatedAt?: Date;
	createdAt?: Date;
}



/*
 |--------------------------------------------------------------------------
 | JSON schema
 |--------------------------------------------------------------------------
*/

const maxShortInputLength = 25;
const maxLongInputLength = 50;

const createPatchContentSchema = {
	'$id': JSchema.ContentSchema,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'title': {
			'type': 'string',
			'maxLength': maxShortInputLength
		},
		'access': {
			'type': 'string',
			'enum': [accessRoles.admin, accessRoles.user, accessRoles.everyone]
		},
		'route': {
			'type': 'string',
			'maxLength': maxShortInputLength
		},
		'content': {
			'type': 'string'
		},
		'description': {
			'type': 'string',
			'maxLength': maxLongInputLength
		},
		'folder': {
			'type': 'string',
			'maxLength': maxShortInputLength
		},
		'nav': {
			'type': 'boolean'
		}
	},
	'required': ['title', 'access', 'route', 'content', 'description', 'folder', 'nav' ]
};



if (ajv.validateSchema(createPatchContentSchema)) {
	ajv.addSchema(createPatchContentSchema, JSchema.ContentSchema);
} else {
	console.error(`${JSchema.ContentSchema} did not validate`);
}

export const ContentModel = model<ContentDoc>('Content', schema);
