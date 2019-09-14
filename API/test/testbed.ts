import { request, use as chaiUse } from 'chai';
import ChaiHttp = require('chai-http');

import { util as configUtil } from 'config';

import * as Mocha from 'mocha';
import { readdirSync } from 'fs';
import { join as pathjoin } from 'path';

import { ContentModel, LogModel, SettingsModel, UserModel, ThemeModel, UserDoc, FileModel } from '../src/models';
import { User, TokenResponse, AccessRoles } from '../types';
import { JWT } from '../global';

import app from '../src/app';

class TestBedSingleton {
	private _http: ChaiHttp.Agent;

	public get http() { return this._http; }
	public AdminUser: UserDoc;
	public AdminCookie: string;
	public AdminRefreshCookie: string;

	public AdminUser2: UserDoc;
	public Admin2Cookie: string;

	public Member: UserDoc;
	public MemberCookie: string;

	public Writer: UserDoc;
	public WriterCookie: string;

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
			await this.dropAllTestCollections();

			// Create new users and log them in
			const [member, admin, admin2, writer] = await Promise.all([
				this.createUser(TestMember),
				this.createUser(AdminUser),
				this.createUser(AdminUser2),
				this.createUser(TestWriterUser)
			]);
			// Member
			TestBed.Member = member.user;
			TestBed.MemberCookie = member.cookie;
			// Admin 1
			TestBed.AdminUser = admin.user;
			TestBed.AdminCookie = admin.cookie;
			TestBed.AdminRefreshCookie = admin.refreshCookie;
			// Admin 2
			TestBed.AdminUser2 = admin2.user;
			TestBed.Admin2Cookie = admin2.cookie;
			// Writer
			TestBed.Writer = writer.user;
			TestBed.WriterCookie = writer.cookie;

			// Initiate tests
			console.timeEnd('Setting up DB for tests');
			console.log('Initiating tests');
			mocha.run(async (failures) => process.exit(failures > 0 ? 1 : 0));
		});
	}


	private async createUser(user: Partial<User>) {
		const userObj = await new UserModel(user).save();
		const res = await TestBed.http.post('/api/auth/login').send({ username: user.username, password: user.password });
		const tokens: TokenResponse = res.body;

		return {
			user: userObj,
			cookie: JWT.COOKIE_AUTH + '=' + tokens.token, // slightly modified
			refreshCookie: JWT.COOKIE_REFRESH + '=' + tokens.refreshToken
		};
	}

	private dropAllTestCollections() {
			return Promise.all([
				UserModel.deleteMany({}).exec(),
				ContentModel.deleteMany({}).exec(),
				LogModel.deleteMany({}).exec(),
				SettingsModel.deleteMany({}).exec(),
				ThemeModel.deleteMany({}).exec(),
				FileModel.deleteMany({}).exec()
			]);
	}
}

// Used in test scenarios
export const AdminUser: Partial<User> = {
	username: 'Admin',
	username_lower: 'admin',
	password: 'test',
	roles: Object.values(AccessRoles), // easier
};
export const AdminUser2: Partial<User> = {
	username: 'Admin2',
	username_lower: 'admin2',
	password: 'test',
	roles: Object.values(AccessRoles), // easier
};
export const TestMember: Partial<User> = {
	username: 'Member',
	username_lower: 'member',
	password: 'test',
	roles: [AccessRoles.member],
};

export const TestWriterUser: Partial<User> = {
	username: 'Writer',
	username_lower: 'writer',
	password: 'test',
	roles: [AccessRoles.writer],
};

export const TestBed = new TestBedSingleton();
export default TestBed;
