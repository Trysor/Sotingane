import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { get as configGet } from 'config';
import { sign } from 'jsonwebtoken';

import { status, ajv, JSchema, AUTH_STATUS, validate } from '../libs/validate';
import { UserModel } from '../models';
import { JWTUser, AccessRoles, TokenResponse, User } from '../../types';
import { JWT } from '../../global';

import { Controller, GET, POST, isProduction } from '../libs/routing';
import { Auth } from '../libs/auth';

enum JWT_Type {
	AUTH = 0,
	REFRESH = 1
}

export class AuthController extends Controller {
	private static createSignedJWT(jwtObject: JWTUser, type: JWT_Type) {
		return new Promise<string>((resolve) => {
			sign(jwtObject, type === JWT_Type.REFRESH ? configGet<string>('refreshSecret') : configGet<string>('secret'), {
				expiresIn: type === JWT_Type.REFRESH ? JWT.EXPIRES_REFRESH : JWT.EXPIRES_AUTH,
				audience: type === JWT_Type.REFRESH ? configGet<string>('refreshTokenAudience') : configGet<string>('tokenAudience')
			}, (err, token) => {
				resolve(err ? null : token);
			});
		});
	}

	private static AddCookie(res: Res, type: JWT_Type, token: string) {
		const isDelete = (!token || token.length === 0);

		const cookieKey = type === JWT_Type.REFRESH
			? JWT.COOKIE_REFRESH
			: JWT.COOKIE_AUTH;

		let maxAge = type === JWT_Type.REFRESH
			? JWT.EXPIRES_REFRESH * 1000
			: JWT.EXPIRES_AUTH * 1000;

		if (isDelete) { maxAge = 1000; }

		return res.cookie(cookieKey, isDelete ? '' : token, {
			maxAge,
			secure: isProduction,
			httpOnly: true,
			sameSite: true
		});
	}

	/**
	 * Returns a new token for a user in a session which is about to expire, if authorized to do so
	 */
	@GET({ path: '/token', do: [Auth.ByRefresh] })
	@POST({ path: '/login', do: [validate(JSchema.UserLoginSchema), Auth.ByLogin] })
	public async token(req: Req, res: Res) {
		// we have through Auth validated the user exists in DB.
		const user: JWTUser = req.user;

		// Generate JWT Object to be sent
		const jwtObject: JWTUser = { _id: user._id, username: user.username, roles: user.roles };

		// Generate API JWT
		const now = Date.now(); // right before signing, so we're never ahead with nextExpiry
		const token = await AuthController.createSignedJWT(jwtObject, JWT_Type.AUTH);

		// Figure out if a refreshToken needs to be generated as well
		const expiryDate = !!user.exp && user.exp * 1000;
		const checkAgainst = now + (JWT.EXPIRES_REFRESH * 1000 * JWT.THRESHOLD_EXPIRY); // if we are within the last 10% of the JWT expiriy

		// Send refresh Token if we send a POST (logging in manually with username and password)
		// or if the refresh token is about to expire
		const doSendRefreshToken =  req.route.path === '/login' || (expiryDate < checkAgainst);

		AuthController.AddCookie(res, JWT_Type.AUTH, token);

		// Create Refresh Token and cookie if necessary
		let refreshToken;
		if (doSendRefreshToken) {
			refreshToken = await AuthController.createSignedJWT(jwtObject, JWT_Type.REFRESH);
			AuthController.AddCookie(res, JWT_Type.REFRESH, refreshToken);
		}

		jwtObject.exp = (now / 1000) + (JWT.EXPIRES_AUTH * (1 - JWT.THRESHOLD_EXPIRY)); // Add in the expiry info

		return res.status(200).send({
			token,
			refreshToken,
			user: jwtObject,
		} as TokenResponse);
	}

	/**
	 * Logs out a user by deleting their session cookie
	 */
	@POST({ path: '/logout', do: [] })
	public logout(req: Req, res: Res): Res {
		const response = AuthController.AddCookie(res, JWT_Type.AUTH, null);
		return AuthController.AddCookie(response, JWT_Type.REFRESH, null)
			.status(200).send(status(AUTH_STATUS.USER_LOGGED_OUT));
	}


	/**
	 * Registers a user
	 */
	@POST({ path: '/register', ignore: isProduction, do: [validate(JSchema.UserRegistrationSchema)] })
	public async register(req: Req, res: Res, next: Next) { // Not enabled in production for the time being
		const password: string = req.body.password;
		const roles: AccessRoles[] = req.body.roles;
		const username: string = req.body.username;


		const userAlreadyExists = await UserModel.findOne({ username_lower: username.toLowerCase() }).lean();

		// check if the username is already in use first
		if (userAlreadyExists) { return res.status(409).send(status(AUTH_STATUS.USERNAME_NOT_AVILIABLE)); }

		const user = await new UserModel({
			username,
			username_lower: username.toLowerCase(),
			password,
			roles,
		} as Partial<User>).save();

		if (!user) { return res.status(409).send(status(AUTH_STATUS.USERNAME_NOT_AVILIABLE)); }
		return res.status(200).send(status(AUTH_STATUS.ACCOUNT_CREATED));
	}


	/**
	 * Updates a user's password based ont he body contents.
	 */
	@POST({ path: '/updatepassword', do: [Auth.ByToken, validate(JSchema.UserUpdatePasswordSchema)] })
	public async updatePassword(req: Req, res: Res, next: Next) {
		const currentPassword: string = req.body.currentPassword;
		const password: string = req.body.password;
		const confirm: string = req.body.confirm;
		const jwtUser: JWTUser = req.user as JWTUser;

		if (password !== confirm) {
			return res.status(401).send(status(AUTH_STATUS.PASSWORD_DID_NOT_MATCH));
		}

		const user = await UserModel.findById(jwtUser._id);

		const isMatch = await user.comparePassword(currentPassword);
		if (!isMatch) { return res.status(401).send(status(AUTH_STATUS.PASSWORD_DID_NOT_MATCH)); }

		user.password = password; // Set new password
		await user.save();
		return res.status(200).send(status(AUTH_STATUS.PASSWORD_UPDATED));
	}


	/**
	 * Deletes a user-account of a given id from req.body.id
	 */
	@POST({ path: '/deleteaccount', ignore: true, do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin)] })
	public async deleteAccount(req: Req, res: Res, next: Next) { // TODO: Implement security
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
	$id: JSchema.UserRegistrationSchema.name,
	type: 'object',
	additionalProperties: false,
	properties: {
		username: {
			type: 'string'
		},
		roles: {
			type: 'array',
			items: {
				type: 'string',
				enum: Object.values(AccessRoles)
			},
			uniqueItems: true
		},
		password: {
			type: 'string'
		}
	},
	required: ['username', 'roles', 'password']
};

if (ajv.validateSchema(userRegistrationSchema)) {
	ajv.addSchema(userRegistrationSchema, JSchema.UserRegistrationSchema.name);
} else {
	throw Error(`${JSchema.UserRegistrationSchema.name} did not validate`);
}


// Login
const loginSchema = {
	$id: JSchema.UserLoginSchema.name,
	type: 'object',
	additionalProperties: false,
	properties: {
		username: {
			type: 'string'
		},
		password: {
			type: 'string',
		},
	},
	required: ['username', 'password']
};

if (ajv.validateSchema(loginSchema)) {
	ajv.addSchema(loginSchema, JSchema.UserLoginSchema.name);
} else {
	throw Error(`${JSchema.UserLoginSchema.name} did not validate`);
}



// UpdatePassword
const userUpdatePasswordSchema = {
	$id: JSchema.UserUpdatePasswordSchema.name,
	type: 'object',
	additionalProperties: false,
	properties: {
		currentPassword: {
			type: 'string'
		},
		password: {
			type: 'string',
		},
		confirm: {
			constant: { $data: '1/password' } // equal to password
		}
	},
	required: ['currentPassword', 'password', 'confirm']
};

if (ajv.validateSchema(userUpdatePasswordSchema)) {
	ajv.addSchema(userUpdatePasswordSchema, JSchema.UserUpdatePasswordSchema.name);
} else {
	throw Error(`${JSchema.UserUpdatePasswordSchema.name} did not validate`);
}


