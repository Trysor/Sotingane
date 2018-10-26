﻿import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { status, ajv, JSchema, USERS_STATUS, validate } from '../libs/validate';
import { User, AccessRoles } from '../../types';
import { UserModel, UserDoc } from '../models';

import { Controller, GET, PATCH } from '../libs/routing';
import { Auth } from '../libs/auth';


export class UsersController extends Controller {

	/**
	 * Gets All registered users
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 */
	@GET({ path: '/users/', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin)] })
	public async getAllUsers(req: Req, res: Res, next: Next) {
		const users = <User[]>await UserModel.find({}, {
			username: 1, role: 1, createdAt: 1
		}).lean().sort('username_lower');
		if (!users) { return res.status(404); } // TODO: Fix me
		return res.status(200).send(users);
	}

	/**
	 * Sets a user role
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 */
	@PATCH({ path: '/users/:id', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin), validate(JSchema.UserAdminUpdateUser)] })
	public async patchUser(req: Req, res: Res, next: Next) {
		const user: User = req.body,
			userId: string = req.params.id,
			username_low = user.username.toLowerCase();

		if (userId !== user._id) {
			return res.status(400).send(status(USERS_STATUS.DATA_UNPROCESSABLE));
		}

		const patchUser = (err: any, patchingUser: UserDoc) => {
			if (err) { return res.status(400).send(status(USERS_STATUS.DATA_UNPROCESSABLE)); }

			patchingUser.username = user.username;
			patchingUser.username_lower = username_low;
			patchingUser.role = user.role;
			patchingUser.save((err2, updated) => {
				if (err2) { return next(err2); }
				if (updated) {
					return res.status(200).send(status(USERS_STATUS.USER_UPDATED));
				}
				// user obj with bad id
				return res.status(400).send(status(USERS_STATUS.DATA_UNPROCESSABLE));
			});
		};

		// Check if the username the user wants is already in use
		const foundUser = await UserModel.findOne({ username_lower: username_low });
		if (foundUser && (foundUser.id !== user._id)) { // intentional .id
			return res.status(409).send(status(USERS_STATUS.USERNAME_NOT_AVILIABLE));
		}

		// Else patch the user
		if (foundUser && foundUser.id === user._id) {
			return patchUser(null, foundUser);
		}
		UserModel.findById(user._id, patchUser);
	}
}

/*
 |--------------------------------------------------------------------------
 | JSON schema
 |--------------------------------------------------------------------------
*/

const userAdminUpdateUser = {
	'$id': JSchema.UserAdminUpdateUser.name,
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
			'enum': [AccessRoles.admin, AccessRoles.user]
		}
	},
	'required': ['_id', 'username', 'role']
};

if (ajv.validateSchema(userAdminUpdateUser)) {
	ajv.addSchema(userAdminUpdateUser, JSchema.UserAdminUpdateUser.name);
} else {
	console.error(`${JSchema.UserAdminUpdateUser.name} did not validate`);
}

