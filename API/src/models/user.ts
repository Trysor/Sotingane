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

export interface User extends Document {
	username: string;
	username_lower?: string;
	password?: string;
	role: accessRoles.admin | accessRoles.user;
	createdAt?: Date;
	comparePassword?: (candidatePassword: string) => Promise<boolean>;
	isOfRole?: (role: accessRoles) => boolean;
	canAccess?: (level: accessRoles) => boolean;
}


/*
 |--------------------------------------------------------------------------
 | JSON schema
 |--------------------------------------------------------------------------
*/


// Registration
const userRegistrationSchema = {
	'$id': JSchema.UserRegistrationSchema,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'username': {
			'type': 'string'
		},
		'role': {
			'type': 'string',
			'enum': [accessRoles.admin, accessRoles.user]
		},
		'password': {
			'type': 'string'
		}
	},
	'required': ['username', 'role', 'password']
};

if (ajv.validateSchema(userRegistrationSchema)) {
	ajv.addSchema(userRegistrationSchema, JSchema.UserRegistrationSchema);
} else {
	console.error(`${JSchema.UserRegistrationSchema} did not validate`);
}


// Login
const loginSchema = {
	'$id': JSchema.UserLoginSchema,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'username': {
			'type': 'string'
		},
		'password': {
			'type': 'string',
		},
	},
	'required': ['username', 'password']
};

if (ajv.validateSchema(loginSchema)) {
	ajv.addSchema(loginSchema, JSchema.UserLoginSchema);
} else {
	console.error(`${JSchema.UserLoginSchema} did not validate`);
}



// UpdatePassword
const userUpdatePasswordSchema = {
	'$id': JSchema.UserUpdatePasswordSchema,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'currentPassword': {
			'type': 'string'
		},
		'password': {
			'type': 'string',
		},
		'confirm': {
			'constant': { '$data': '1/password' } // equal to password
		}
	},
	'required': ['currentPassword', 'password', 'confirm']
};

if (ajv.validateSchema(userUpdatePasswordSchema)) {
	ajv.addSchema(userUpdatePasswordSchema, JSchema.UserUpdatePasswordSchema);
} else {
	console.error(`${JSchema.UserUpdatePasswordSchema} did not validate`);
}


const userAdminUpdateUser = {
	'$id': JSchema.UserAdminUpdateUser,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'_id': {
			'type': 'string',
			'maxLength': 24,
			'minLength': 24
		},
		'username': {
			'type': 'string',
		},
		'role': {
			'type': 'string',
			'enum': [accessRoles.admin, accessRoles.user]
		}
	},
	'required': ['_id', 'username', 'role']
};

if (ajv.validateSchema(userAdminUpdateUser)) {
	ajv.addSchema(userAdminUpdateUser, JSchema.UserAdminUpdateUser);
} else {
	console.error(`${JSchema.UserAdminUpdateUser} did not validate`);
}


/*
 |--------------------------------------------------------------------------
 | Hooks
 |--------------------------------------------------------------------------
*/


// Before saving do the following
schema.pre('save', function (next: NextFunction) {
	const u = <User>this; // hard-casting
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


export let UserModel = model<User>('User', schema);
