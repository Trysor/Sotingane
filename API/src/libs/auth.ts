import { get as configGet } from 'config';
import { Strategy as JwtStrategy, StrategyOptions as jwtOptions, VerifiedCallback } from 'passport-jwt';
import { verify } from 'jsonwebtoken';
import { Strategy as LocalStrategy, IStrategyOptions as localOptions } from 'passport-local';
import { use as passportUse, authenticate } from 'passport';
import { Handler } from 'express';
import { Request, Response, NextFunction } from 'express';

import { Types as MongoTypes } from 'mongoose';

import { AccessRoles, JWTUser, AuthorObject } from '../../types';
import { JWT } from '../../global';

import { UserModel } from '../models';
import { status, ROUTE_STATUS } from './validate';


/*
 |--------------------------------------------------------------------------
 | Configuration
 |--------------------------------------------------------------------------
*/

const ByTokenName = 'ByToken';
const ByRefreshName = 'ByRefresh';

const localOptions: localOptions = {
	usernameField: 'username'
};

// Setting JWT strategy options
const jwtOptions: jwtOptions = {
	jwtFromRequest: (req: Request): string => {
		return !!req.headers.authorization
			? req.headers.authorization
			: req.cookies[JWT.COOKIE_AUTH];
	},
	secretOrKey: configGet<string>('secret'),
	audience: configGet<string>('tokenAudience'),
};

const jwtRefreshOptions: jwtOptions = {
	jwtFromRequest: (req: Request): string => {
		return !!req.headers.authorization
			? req.headers.authorization
			: req.cookies[JWT.COOKIE_REFRESH];
	},
	secretOrKey: configGet<string>('refreshSecret'),
	audience: configGet<string>('refreshTokenAudience')
};

/*
 |--------------------------------------------------------------------------
 | Strategies
 |--------------------------------------------------------------------------
*/

// Setting up local login strategy
passportUse(new LocalStrategy(localOptions, async (username, password, done) => {
	const user = await UserModel.findOne({ username_lower: username.toLowerCase() });
	if (!user) { return done(null, null); }
	const isMatch = await user.comparePassword(password);
	done(null, isMatch ? <JWTUser>{ _id: user._id, username: user.username, roles: user.roles } : null);
}));

// Setting up JWT login strategies
passportUse(ByTokenName, new JwtStrategy(jwtOptions, async (payload: JWTUser, done: VerifiedCallback) => {
	done(null, payload);
}));
passportUse(ByRefreshName, new JwtStrategy(jwtRefreshOptions, async (payload: JWTUser, done: VerifiedCallback) => {
	const user = await UserModel.findById(payload._id).lean(); // we need to verify the user is still in fact a user
	if (!user) { return done(null, null); }

	const newPayload: JWTUser = {
		_id: user._id,
		roles: user.roles,
		username: user.username,
		exp: payload.exp
	};
	done(null, newPayload);
}));


const Personalize = (req: Request, res: Response, next: NextFunction) => {
	const token = jwtOptions.jwtFromRequest(req);
	verify(token, jwtOptions.secretOrKey, jwtOptions, async (err, tokenPayload: any) => {
		if (err) { return next(); }
		req.user = tokenPayload;
		next();
	});
};


const RequireRole = (role: AccessRoles) => {
	return (req: Request, res: Response, next: NextFunction) => {
		return Auth.CanUserAccess(<JWTUser>req.user, role)
			? next()
			: res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED));
	};
};

/*
 |--------------------------------------------------------------------------
 | Auth
 |--------------------------------------------------------------------------
*/


export class Auth {
	// Authentication Handlers
	public static ByLogin: Handler = authenticate('local', { session: false });
	public static ByToken: Handler = authenticate(ByTokenName, { session: false });
	public static ByRefresh: Handler = authenticate(ByRefreshName, { session: false });
	public static Personalize: Handler = Personalize;
	public static RequireRole = RequireRole;


	// Access Rights methods

	/**
	 * Returns true if the user has access rights given the parameters of roles and author
	 * @param user User object containing the roles to match against. Null if no user is present
	 * @param roles The role or roles to which the user is to match
	 * @param author The author of the Content one wish to verify access rights to
	 */
	public static CanUserAccess(user: JWTUser, roles: AccessRoles | AccessRoles[], author: AuthorObject = null): boolean {
		if (!roles || (roles instanceof Array && roles.length === 0)) { return true; }
		if (!user || !user.roles) { return false; }

		if (user.roles.includes(AccessRoles.writer) && !!author && MongoTypes.ObjectId(user._id).equals(author._id)) {
			return true;
		}
		if (typeof roles === 'string') {
			return user.roles.includes(roles);
		}
		return user.roles.some(x => roles.includes(x));
	}

	/**
	 * Creates the match object with prefilled access user rights data to be used with Mongoose aggregation queries
	 * @param user User object containing the roles to match against. Null if no user is present
	 * @param match Optional object containing other match objects
	 */
	public static getUserAccessMatchObject(user: JWTUser, match: any = {}) {
		if (user) {
			const matchOrSelect = <any>[
				{ 'current.access': { $elemMatch: { $in: user.roles } } },
				{ 'current.access': { $eq: <AccessRoles[]>[] } }
			];
			if (!!user.roles && user.roles.includes(AccessRoles.writer)) {
				matchOrSelect.push({ 'current.createdBy': { $eq: MongoTypes.ObjectId(user._id) }});
			}
			match = Object.assign({ $or: matchOrSelect }, match);
		} else {
			match = Object.assign({ 'current.access': { $eq: <AccessRoles[]>[] } }, match);
		}
		return match;
	}
}
