﻿import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { status, JSchema, USERS_STATUS, validate, RegisterSchema } from '../libs/validate';
import { User, AccessRoles } from '../../types';
import { UserModel, UserDoc } from '../models';

import { Controller, RouteDomain, GET, PATCH } from '../libs/routing';
import { Auth } from '../libs/auth';


@RouteDomain('/admin')
export class UsersController extends Controller {


	/**
	 * Gets All registered users
	 */
	@GET({ path: '/users/', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin)] })
	public async getAllUsers(req: Req, res: Res, next: Next) {
		const users = await UserModel.find(
			{},
			{
				username: 1,
				roles: 1,
				createdAt: 1
			}
		).lean<User[]>().sort('username_lower');

		return res.status(200).send(users); // At least one user has to exist
	}

	/**
	 * Sets a user role
	 */
	@PATCH({ path: '/users/:id', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin), validate(JSchema.UserAdminUpdateUser)] })
	public async patchUser(req: Req, res: Res, next: Next) {
		const user: User = req.body;
		const userId: string = req.params.id;
		const usernameLowerCase = user.username.toLowerCase();

		if (userId !== user._id) {
			return res.status(400).send(status(USERS_STATUS.DATA_UNPROCESSABLE));
		}

		const patchUser = (err: any, patchingUser: UserDoc) => {
			if (err) { return res.status(400).send(status(USERS_STATUS.DATA_UNPROCESSABLE)); }

			patchingUser.username = user.username;
			patchingUser.username_lower = usernameLowerCase;
			patchingUser.roles = user.roles;
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
		const foundUser = await UserModel.findOne({ username_lower: usernameLowerCase });
		if (foundUser && (foundUser.id !== user._id)) { // intentional .id
			return res.status(409).send(status(USERS_STATUS.USERNAME_NOT_AVILIABLE));
		}

		// Else patch the user
		if (foundUser && foundUser.id === user._id) {
			return patchUser(null, foundUser);
		}
		UserModel.findById(user._id, patchUser);
	}

	// ---------------------------------------
	// ------------ JSON SCHEMAS -------------
	// ---------------------------------------


	@RegisterSchema(JSchema.UserAdminUpdateUser)
	public get patchUserSchema() {
		return {
			type: 'object',
			additionalProperties: false,
			properties: {
				_id: {
					type: 'string',
					maxLength: 24,
					minLength: 24
				},
				username: {
					type: 'string',
				},
				roles: {
					type: 'array',
					items: {
						type: 'string',
						enum: Object.values(AccessRoles)
					},
					uniqueItems: true
				}
			},
			required: ['_id', 'username', 'roles']
		};
	}
}



