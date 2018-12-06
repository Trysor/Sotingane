import { request, use as chaiUse } from 'chai';
import ChaiHttp = require('chai-http');

import { util as configUtil } from 'config';

import * as Mocha from 'mocha';
import { readdirSync } from 'fs';
import { join as pathjoin } from 'path';

import { ContentModel, LogModel, SettingsModel, UserModel, ThemeModel, UserDoc } from '../src/models';
import { User, UserToken, AccessRoles } from '../types';

import app from '../src/app';

class TestBedSingleton {
	private _http: ChaiHttp.Agent;

	public get http() { return this._http; }
	public AdminUser: UserDoc;
	public AdminCookie: string;

	public AdminUser2: UserDoc;
	public Admin2Cookie: string;

	public User: UserDoc;
	public UserCookie: string;

	constructor() {
		if (configUtil.getEnv('NODE_ENV') !== 'test') { return; }

		chaiUse(ChaiHttp);
		this._http = request(app).keepOpen();

		const mocha = new Mocha();
		const path = pathjoin('dist', 'out-tsc', 'API', 'test');
		readdirSync(path).filter((file) => file.endsWith('.test.js')).forEach((file) => {
			mocha.addFile(pathjoin(path, file));
		});

		app.on('launched', async () => {
			console.log('Connecting with MongoDB..');
			console.time('Setting up DB for tests');

			// Drop Test collections
			await Promise.all([
				UserModel.deleteMany({}).exec(),
				ContentModel.deleteMany({}).exec(),
				LogModel.deleteMany({}).exec(),
				SettingsModel.deleteMany({}).exec(),
				ThemeModel.deleteMany({}).exec()
			]);

			// Create new users and log them in
			const [user, admin, admin2] = await Promise.all([
				this.createUser(TestUser),
				this.createUser(AdminUser),
				this.createUser(AdminUser2)
			]);
			TestBed.User = user.user;
			TestBed.UserCookie = user.cookie;
			TestBed.AdminUser = admin.user;
			TestBed.AdminCookie = admin.cookie;
			TestBed.AdminUser2 = admin2.user;
			TestBed.Admin2Cookie = admin2.cookie;

			// Initiate tests
			console.timeEnd('Setting up DB for tests');
			console.log('Initiating tests');
			mocha.run((failures) => process.exit(failures > 0 ? 1 : 0));
		});
	}


	private async createUser(user: Partial<User>): Promise<{ user: UserDoc, cookie: string }> {
		const userObj = await new UserModel(user).save();
		const res = await TestBed.http.post('/api/auth/login').send({ username: user.username, password: user.password });

		return {
			user: userObj,
			cookie: 'jwt=' + (<UserToken>res.body).token // slightly modified
		};
	}
}

// Used in test scenarios
export const AdminUser: Partial<User> = {
	username: 'Admin',
	username_lower: 'admin',
	password: 'test',
	role: AccessRoles.admin,
};
export const AdminUser2: Partial<User> = {
	username: 'Admin2',
	username_lower: 'admin2',
	password: 'test',
	role: AccessRoles.admin,
};
export const TestUser: Partial<User> = {
	username: 'User',
	username_lower: 'user',
	password: 'test',
	role: AccessRoles.user,
};

export const TestBed = new TestBedSingleton();
export default TestBed;
