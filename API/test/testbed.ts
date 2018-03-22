import { Express } from 'express';
import { request, use as chaiUse } from 'chai';
import ChaiHttp = require('chai-http');

import { util as configUtil, get as configGet } from 'config';

import * as Mocha from 'mocha';
import { readdirSync } from 'fs';
import { join as pathjoin } from 'path';

import { User, accessRoles } from '../src/models/user';

import app from '../src/index';

export class TestBedSingleton {
	private _http: ChaiHttp.Agent;

	constructor() {
		if (configUtil.getEnv('NODE_ENV') !== 'test') { return; }
		const db = configGet<string>('database');

		chaiUse(ChaiHttp);
		this._http = (<any>request(app)).keepOpen(); // TODO: Update @types/chai-http

		const mocha = new Mocha();
		readdirSync(pathjoin('dist', 'out-tsc', 'test')).filter((file) => file.endsWith('.test.js')).forEach((file) => {
			mocha.addFile(pathjoin('dist', 'out-tsc', 'test', file));
		});
		console.log('Delaying tests for mongoDB..');
		setTimeout(() => mocha.run((failures) => process.exit()), 5000);
	}

	public get http() {
		return this._http;
	}

	public AdminUser: User;
	public AdminToken: string;
}

export const TestBed = new TestBedSingleton();

export default TestBed;


// Used in all test scenarios
export const AdminUser: Partial<User> = {
	username: 'Admin',
	username_lower: 'admin',
	password: 'test',
	role: accessRoles.admin,
};
