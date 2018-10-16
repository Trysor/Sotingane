import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { get as configGet, util as configUtil } from 'config';
import { sign } from 'jsonwebtoken';

import { status, ajv, JSchema, AUTH_STATUS, validate } from '../libs/validate';
import { UserModel, User, UserDoc, accessRoles } from '../models';

import { Controller, GET, POST, isProduction } from '../libs/routing';
import { Auth } from '../libs/auth';


export interface TokenResponse {
	token: string;
	user: User;
}

export class AuthController extends Controller {

	/**
	 * Returns a new token for a user in a session which is about to expire, if authorized to do so
	 * @param  {Req}      req  request
	 * @param  {Res}     res  response
	 * @param  {Next} next next
	 * @return {Res}          server response: object containing token and user
	 */
	@GET({ path: '/token', do: [Auth.ByToken] })
	@POST({ path: '/login', do: [validate(JSchema.UserLoginSchema), Auth.ByLogin] })
	public token(req: Req, res: Res): Res {
		const user: Partial<User> = { _id: req.user._id, username: req.user.username, role: req.user.role };

		const expires = 10800; // expiresIn in seconds ( = 3hours)
		const token = sign(user, configGet<string>('secret'), { expiresIn: expires });

		return res.cookie('jwt', token, {
			maxAge: expires * 1000,
			secure: configUtil.getEnv('NODE_ENV') === 'production',
			httpOnly: true,
			sameSite: true
		}).status(200).send({ token: token, user: user });
	}


	/**
	 * Logs out a user by deleting their session cookie
	 * @param  {Req}      req  request
	 * @param  {Res}     res  response
	 * @param  {Next} next next
	 * @return {Res}          server response: object containing token and user
	 */
	@POST({ path: '/logout', do: [Auth.ByToken] })
	public logout(req: Req, res: Res): Res {
		return res.cookie('jwt', '', {
			maxAge: 1000, // one second
			secure: isProduction,
			domain: req.hostname,
			httpOnly: true,
			sameSite: true
		}).status(200).send(status(AUTH_STATUS.USER_LOGGED_OUT));
	}


	/**
	 * Registers a user
	 * @param  {Req}      req  request
	 * @param  {Res}     res  response
	 * @param  {Next} next next
	 * @return {Res}          server response
	 */
	@POST({ path: '/register', ignore: isProduction, do: [validate(JSchema.UserRegistrationSchema)] })
	public async register(req: Req, res: Res, next: Next) { // Not enabled in production for the time being
		const password: string = req.body.password,
			role: accessRoles = req.body.role,
			username: string = req.body.username;

		const userAlreadyExists = await UserModel.findOne({ username_lower: username.toLowerCase() }).lean();

		// check if the username is already in use first
		if (userAlreadyExists) { return res.status(409).send(status(AUTH_STATUS.USERNAME_NOT_AVILIABLE)); }

		const user = await new UserModel({
			username: username,
			username_lower: username.toLowerCase(),
			password: password,
			role: role,
		}).save();

		if (!user) { return res.status(409).send(status(AUTH_STATUS.USERNAME_NOT_AVILIABLE)); }
		return res.status(200).send(status(AUTH_STATUS.ACCOUNT_CREATED));
	}


	/**
	 * Updates a user's password based ont he body contents.
	 * @param  {Req}      req  request
	 * @param  {Res}     res  response
	 * @param  {Next} next next
	 * @return {Res}          server response:
	 */
	@POST({ path: '/updatepassword', do: [Auth.ByToken, validate(JSchema.UserUpdatePasswordSchema)] })
	public async updatePassword(req: Req, res: Res, next: Next) {
		const currentPassword: string = req.body.currentPassword,
			password: string = req.body.password,
			confirm: string = req.body.confirm,
			user: UserDoc = <UserDoc>req.user;

		if (password !== confirm) {
			return res.status(401).send(status(AUTH_STATUS.PASSWORD_DID_NOT_MATCH));
		}

		const isMatch = await user.comparePassword(currentPassword);
		if (!isMatch) { return res.status(401).send(status(AUTH_STATUS.PASSWORD_DID_NOT_MATCH)); }

		user.password = password; // Set new password
		await user.save();
		return res.status(200).send(status(AUTH_STATUS.PASSWORD_UPDATED));
	}


	/**
	 * Deletes a user-account of a given id from req.body.id
	 * @param  {Req}      req  request
	 * @param  {Res}     res  response
	 * @param  {Next} next next
	 * @return {Res}          server response
	 */
	@POST({ path: '/deleteaccount', ignore: true, do: [Auth.ByToken, Auth.RequireRole(accessRoles.admin)] })
	public async deleteAccount(req: Req, res: Res, next: Next) { // TODO: Implement my security
		const id: string = req.body.id;

		try {
			await UserModel.findByIdAndRemove(id).lean();
		} catch (e) {
			return res.status(400).send(status(AUTH_STATUS.USER_ID_NOT_FOUND));
		}
		return res.status(200).send(status(AUTH_STATUS.ACCOUNT_DELETED));
	}
}



/*
 |--------------------------------------------------------------------------
 | JSON schema
 |--------------------------------------------------------------------------
*/


// Registration
const userRegistrationSchema = {
	'$id': JSchema.UserRegistrationSchema.name,
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
	ajv.addSchema(userRegistrationSchema, JSchema.UserRegistrationSchema.name);
} else {
	console.error(`${JSchema.UserRegistrationSchema.name} did not validate`);
}


// Login
const loginSchema = {
	'$id': JSchema.UserLoginSchema.name,
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
	ajv.addSchema(loginSchema, JSchema.UserLoginSchema.name);
} else {
	console.error(`${JSchema.UserLoginSchema.name} did not validate`);
}



// UpdatePassword
const userUpdatePasswordSchema = {
	'$id': JSchema.UserUpdatePasswordSchema.name,
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
	ajv.addSchema(userUpdatePasswordSchema, JSchema.UserUpdatePasswordSchema.name);
} else {
	console.error(`${JSchema.UserUpdatePasswordSchema.name} did not validate`);
}


