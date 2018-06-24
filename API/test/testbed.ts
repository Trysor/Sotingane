import { Express } from 'express';
import { request, use as chaiUse } from 'chai';
import ChaiHttp = require('chai-http');

import { util as configUtil, get as configGet } from 'config';

import * as Mocha from 'mocha';
import { readdirSync } from 'fs';
import { join as pathjoin } from 'path';

import { UserModel, User, accessRoles } from '../src/models/user';
import { TokenResponse } from '../src/controllers/auth';

import app from '../src/index';

export class TestBedSingleton {
	private _http: ChaiHttp.Agent;

	public get http() { return this._http; }
	public AdminUser: User;
	public AdminToken: string;

	public MemberUser: User;
	public MemberToken: string;

	constructor() {
		if (configUtil.getEnv('NODE_ENV') !== 'test') { return; }
		const db = configGet<string>('database');

		chaiUse(ChaiHttp);
		this._http = (<any>request(app)).keepOpen(); // TODO: Update @types/chai-http

		const mocha = new Mocha();
		readdirSync(pathjoin('dist', 'out-tsc', 'test')).filter((file) => file.endsWith('.test.js')).forEach((file) => {
			mocha.addFile(pathjoin('dist', 'out-tsc', 'test', file));
		});

		app.on('launched', async () => {
			console.log('Connecting with MongoDB..');
			console.time('Setting up DB for tests');

			// Delete all current users
			await UserModel.remove({}).exec();

			// Create new users and log them in
			const [admin, member] = await Promise.all([this.createUser(AdminUser), this.createUser(MemberUser)]);
			TestBed.AdminUser = admin.user;
			TestBed.AdminToken = admin.token;
			TestBed.MemberUser = member.user;
			TestBed.MemberToken = member.token;

			// Initiate tests
			console.timeEnd('Setting up DB for tests');
			console.log('Initiating tests');
			mocha.run((failures) => process.exit());
		});
	}


	private async createUser(user: Partial<User>): Promise<{ user: User, token: string }> {
		const userObj = await new UserModel(user).save();
		const res = await TestBed.http.post('/api/auth/login').send({ username: user.username, password: user.password });

		return {
			user: userObj,
			token: (<TokenResponse>res.body).token
		};
	}
}

export const TestBed = new TestBedSingleton();
export default TestBed;

// Used in test scenarios
export const AdminUser: Partial<User> = {
	username: 'Admin',
	username_lower: 'admin',
	password: 'test',
	role: accessRoles.admin,
};
export const MemberUser: Partial<User> = {
	username: 'Member',
	username_lower: 'member',
	password: 'test',
	role: accessRoles.user,
};

