import { get as configGet } from 'config';
import { Strategy as JwtStrategy, StrategyOptions as jwtOptions, VerifiedCallback } from 'passport-jwt';
import { verify } from 'jsonwebtoken';
import { Strategy as LocalStrategy, IStrategyOptions as localOptions } from 'passport-local';
import { use as passportUse, authenticate } from 'passport';
import { Handler } from 'express';
import { Request, Response, NextFunction } from 'express';

import { UserModel, accessRoles, User } from '../models';
import { status, ROUTE_STATUS } from './validate';


/*
 |--------------------------------------------------------------------------
 | Configuration
 |--------------------------------------------------------------------------
*/

const ByTokenName = 'ByToken';

const localOptions: localOptions = {
	usernameField: 'username'
};

// Setting JWT strategy options
const jwtOptions: jwtOptions = {
	jwtFromRequest: (req: Request): string => {
		if (req.cookies && !!req.cookies.jwt) { return req.cookies.jwt; }
		if (req.headers && !!req.headers.authorization) { return req.headers.authorization; }
		return null;
	},
	secretOrKey: configGet<string>('secret') // Tell Passport where to find the secret
	// TO-DO: Add issuer and audience checks
};

/*
 |--------------------------------------------------------------------------
 | Strategies
 |--------------------------------------------------------------------------
*/

// Setting up local login strategy
const ByLogin = new LocalStrategy(localOptions, async (username, password, done) => {
	const user = await UserModel.findOne({ username_lower: username.toLowerCase() });
	if (!user) { return done(null, null); }
	const isMatch = await user.comparePassword(password);
	done(null, isMatch ? user : null);
});



// Setting up JWT login strategies
const ByToken = new JwtStrategy(jwtOptions, async (payload: any, done: VerifiedCallback) => {
	const user = await UserModel.findById(payload._id);
	done(null, user ? user : null);
});


/*
 |--------------------------------------------------------------------------
 | Passport Use
 |--------------------------------------------------------------------------
*/

passportUse(ByLogin);
passportUse(ByTokenName, ByToken);


/*
 |--------------------------------------------------------------------------
 | Auth
 |--------------------------------------------------------------------------
*/

const Personalize = (req: Request, res: Response, next: NextFunction) => {
	const token = jwtOptions.jwtFromRequest(req);
	verify(token, jwtOptions.secretOrKey, jwtOptions, async (err, tokenPayload: any) => {
		if (err) { return next(); }
		req.user = await UserModel.findById(tokenPayload._id);
		next();
	});
};

const RequireRole = (role: accessRoles) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = <User>req.user;
		if (user && (user.isOfRole(role) || user.isOfRole(accessRoles.admin))) {
			return next();
		}
		return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED));
	};
};


export class Auth {
	public static ByLogin: Handler = authenticate('local', { session: false });
	public static ByToken: Handler = authenticate(ByTokenName, { session: false });
	public static Personalize: Handler = Personalize;
	public static RequireRole = RequireRole;
}
