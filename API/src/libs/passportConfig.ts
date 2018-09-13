import { get as configGet } from 'config';
import { Strategy as JwtStrategy, StrategyOptions as jwtOptions, VerifiedCallback } from 'passport-jwt';
import { verify } from 'jsonwebtoken';
import { Strategy as LocalStrategy, IStrategyOptions as localOptions } from 'passport-local';
import { use as passportUse, authenticate } from 'passport';
import { Handler } from 'express';
import { Request, Response, NextFunction } from 'express';

import { UserModel } from '../models';


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

export class PassportConfig {
	public static requireLogin: Handler;
	public static requireAuth: Handler;
	public static configureForUser: Handler;

	public static initiate() {
		// apply passport settings
		passportUse(requireLogin);
		passportUse('requireAuth', requireAuth); // So long you're logged in access will be granted

		this.requireLogin = authenticate('local', { session: false });
		this.requireAuth = authenticate('requireAuth', { session: false });
		this.configureForUser = configureForUser;
	}
}



// Setting up local login strategy
const requireLogin = new LocalStrategy(localOptions, async (username, password, done) => {
	const user = await UserModel.findOne({ username_lower: username.toLowerCase() });
	if (!user) { return done(null, null); }
	const isMatch = await user.comparePassword(password);
	done(null, isMatch ? user : null);
});



// Setting up JWT login strategies
const requireAuth = new JwtStrategy(jwtOptions, async (payload: any, done: VerifiedCallback) => {
	const user = await UserModel.findById(payload._id);
	done(null, user ? user : null);
});


const configureForUser = (req: Request, res: Response, next: NextFunction) => {
	const token = jwtOptions.jwtFromRequest(req);
	verify(token, jwtOptions.secretOrKey, jwtOptions, async (err, tokenPayload: any) => {
		if (err) { return next(); }
		req.user = await UserModel.findById(tokenPayload._id);
		next();
	});
};
