import { Document, model, Schema } from 'mongoose';
import { hash, compare } from 'bcrypt';
import { NextFunction } from 'express';

import { AccessRoles, User } from '../../types';
import { BCRYPT_SALT_FACTOR } from '../../global';

/*
 |--------------------------------------------------------------------------
 | User schema
 |--------------------------------------------------------------------------
*/

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
	roles: [{
		type: String,
		enum: Object.values(AccessRoles),
	}],
},
{
	timestamps: { createdAt: true, updatedAt: false }
});


/*
 |--------------------------------------------------------------------------
 | Hooks
 |--------------------------------------------------------------------------
*/


// Before saving do the following
schema.pre('save', function (next: NextFunction) {
	const u = <UserDoc>this; // hard-casting
	if (!u.isModified('password')) { return next(); }
	hash(u.password, BCRYPT_SALT_FACTOR, (err, hashed) => {
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

schema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	const u: User = this;
	return compare(candidatePassword, u.password);
};

schema.methods.canAccess = function (level: AccessRoles): boolean {
	return (<User>this).roles.includes(level);
};

export interface UserDoc extends User, Document { }
export let UserModel = model<UserDoc>('User', schema);
