import { Document, model, Model, Schema } from 'mongoose';
import { hash, compare } from 'bcrypt';
import { NextFunction } from 'express';

import { ajv, JSchema } from '../libs/validate';

const SALT_FACTOR = 12;

/*
 |--------------------------------------------------------------------------
 | User schema
 |--------------------------------------------------------------------------
*/

export enum accessRoles {
	admin = 'admin',
	user = 'user',
	everyone = 'everyone'
}


const schema = new Schema({
	username: {
		type: String,
		unique: true,
		required: true
	},
	username_lower: {
		type: String,
		unique: true,
		required: true,
		index: { unique: true }
	},
	password: {
		type: String, // Not in clear text
		required: true
	},
	role: {
		type: String,
		enum: [accessRoles.admin, accessRoles.user],
		default: accessRoles.user
	},
},
{
	timestamps: { createdAt: true, updatedAt: false }
});

export interface User {
	username: string;
	username_lower?: string;
	password?: string;
	role: accessRoles.admin | accessRoles.user;
	createdAt?: Date;
	comparePassword?: (candidatePassword: string) => Promise<boolean>;
	isOfRole?: (role: accessRoles) => boolean;
	canAccess?: (level: accessRoles) => boolean;
	_id: any;
}

/*
 |--------------------------------------------------------------------------
 | Hooks
 |--------------------------------------------------------------------------
*/


// Before saving do the following
schema.pre('save', function (next: NextFunction) {
	const u = <UserDoc>this; // hard-casting
	if (!u.isModified('password')) { return next(); }
	hash(u.password, SALT_FACTOR, (err, hashed) => {
		if (err) { return next(err); }
		u.password = hashed;
		next();
	});
});

/*
 |--------------------------------------------------------------------------
 | Methods
 |--------------------------------------------------------------------------
*/

// Compare password
schema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	const u: User = this;
	return compare(candidatePassword, u.password);
};


// IsOfRole
schema.methods.isOfRole = function (role: accessRoles): boolean {
	const u: User = this;
	return u.role === role;
};

schema.methods.canAccess = function (level: accessRoles): boolean {
	const u: User = this;
	return level === accessRoles.everyone || u.role === accessRoles.admin || u.isOfRole(level);
};

export interface UserDoc extends User, Document { }
export let UserModel = model<UserDoc>('User', schema);
