import { expect } from 'chai';
import { Request as Req, Response as Res, NextFunction as Next } from 'express';
import { UserModel, User, accessRoles } from '../src/models/user';
import { status, ROUTE_STATUS, AUTH_STATUS, VALIDATION_FAILED } from '../src/libs/validate';
import { AuthController, TokenResponse } from '../src/controllers/auth';

import { TestBed, AdminUser } from './testbed';


// ---------------------------------
// ---------- Test Object ----------
// ---------------------------------

const userToRegister: Partial<User> = {
	username: 'Bob',
	password: 'aaaaaaa',
	role: accessRoles.admin,
};

// ---------------------------------
// ---- Authorization TestSuite ----
// ---------------------------------



describe('REST: Authorization', () => {

	// ---------------------------------
	// -------- /api/auth/token --------
	// ---------------------------------


	describe('/api/auth/token', () => {
		it('GET /api/auth/token 200', async () => {
			const res = await TestBed.http.get('/api/auth/token').set('Authorization', TestBed.AdminToken);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');

			const body: TokenResponse = res.body;
			expect(body.token).to.contains(TestBed.AdminToken.split('.')[0]);
			expect(body.user).to.have.property('username');
			expect(body.user).property('username').to.equal(AdminUser.username);
		});

		it('GET /api/auth/token 401', async () => {

			const res = await TestBed.http.get('/api/auth/token');
			expect(res).to.have.status(401);
		});
	});



	// ---------------------------------
	// -------- /api/auth/login --------
	// ---------------------------------

	describe('/api/auth/login', () => {
		it('POST /api/auth/login 200', async () => {
			const user: Partial<User> = { username: AdminUser.username, password: AdminUser.password };
			const res = await TestBed.http.post('/api/auth/login').send(user);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');

			const body: TokenResponse = res.body;
			expect(body).to.have.property('token');
			expect(body).property('token').to.contain('bearer ');
			expect(body.user).to.have.property('username');
			expect(body.user).property('username').to.equal(AdminUser.username);
		});


		it('POST /api/auth/login 401', async () => {
			const user: Partial<User> = { username: AdminUser.username, password: AdminUser.password + 'bad' };
			const res = await TestBed.http.post('/api/auth/login').send(user);
			expect(res).to.have.status(401);
		});

		it('POST /api/auth/login 422', async () => {
			const user: Partial<User> = { username: AdminUser.username }; // missing password

			const res = await TestBed.http.post('/api/auth/login').send(user);

			expect(res).to.have.status(422);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(VALIDATION_FAILED.USER_MODEL);
			expect(res.body).to.have.property('errors');
			expect(res.body.errors).to.be.an('array');
			expect(res.body.errors[0]).to.have.property('error');
			expect(res.body.errors[0]).to.have.property('params');
			expect(res.body.errors[0].params).to.have.property('missingProperty');
			expect(res.body.errors[0].params.missingProperty).to.equal('password');
		});
	});


	// ---------------------------------
	// ------ /api/auth/register -------
	// ---------------------------------

	describe('/api/auth/register', () => {
		it('POST /api/auth/register 200', async () => {
			const res = await TestBed.http.post('/api/auth/register').send(userToRegister);
			expect(res).status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body).property('message').to.equal(AUTH_STATUS.ACCOUNT_CREATED);
		});


		it('POST /api/auth/register 409', async () => {
			const user: Partial<User> = {
				username: userToRegister.username,
				password: userToRegister.password,
				role: accessRoles.admin
			};

			const res = await TestBed.http.post('/api/auth/register').send(user);

			expect(res).status(409);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body).property('message').to.equal(AUTH_STATUS.USERNAME_NOT_AVILIABLE);
		});

		it('POST /api/auth/register 422', async () => {
			const noUsername: Partial<User> = { password: 'aaa', role: accessRoles.user };
			const noPassword: Partial<User> = { username: userToRegister.username + 'test', role: accessRoles.user };
			const noRole: Partial<User> = { username: userToRegister.username + 'test', password: 'aaa' };
			const badRole: Partial<User> = {
				username: userToRegister.username + 'test',
				password: userToRegister.password + 'test', role: <any>'bad'
			};
			const badEverything = {};

			const [noUsernameRes, noPasswordRes, noRoleRes, badRoleRes, badEverythingRes] = await Promise.all([
				TestBed.http.post('/api/auth/register').send(noUsername),
				TestBed.http.post('/api/auth/register').send(noPassword),
				TestBed.http.post('/api/auth/register').send(noRole),
				TestBed.http.post('/api/auth/register').send(badRole),
				TestBed.http.post('/api/auth/register').send(badEverything)

			]);

			// noUsernameRes
			expect(noUsernameRes).to.have.status(422);
			expect(noUsernameRes).to.have.property('body');
			expect(noUsernameRes.body).to.have.property('message');
			expect(noUsernameRes.body.message).to.equal(VALIDATION_FAILED.USER_MODEL);
			expect(noUsernameRes.body).to.have.property('errors');
			expect(noUsernameRes.body.errors).to.be.an('array');
			expect(noUsernameRes.body.errors[0]).to.have.property('error');
			expect(noUsernameRes.body.errors[0]).to.have.property('params');
			expect(noUsernameRes.body.errors[0].params).to.have.property('missingProperty');
			expect(noUsernameRes.body.errors[0].params.missingProperty).to.equal('username');


			// noPasswordRes
			expect(noPasswordRes).to.have.status(422);
			// noUsernameRes
			expect(noRoleRes).to.have.status(422);
			// badRoleRes
			expect(badRoleRes).to.have.status(422);
			// badEverythingRes
			expect(badEverythingRes).to.have.status(422);
		});
	});


	// ---------------------------------
	// --- /api/auth/updatepassword ----
	// ---------------------------------

	describe('/api/auth/updatepassword', () => {

		it('POST /api/auth/updatepassword 200', async () => {
			const user = {
				currentPassword: AdminUser.password,
				password: AdminUser.password + '2',
				confirm: AdminUser.password + '2',
			};

			const res = await TestBed.http.post('/api/auth/updatepassword').send(user).set('Authorization', TestBed.AdminToken);

			expect(res).status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body).property('message').to.equal(AUTH_STATUS.PASSWORD_UPDATED);
		});


		it('POST /api/auth/updatepassword 401', async () => {
			const noTokenAttempt = {
				currentPassword: AdminUser.password,
				password: AdminUser.password + '2',
				confirm: AdminUser.password + '2',
			};
			const wrongCurrentPasswordAttempt = {
				currentPassword: AdminUser.password + '1',
				password: AdminUser.password + '2',
				confirm: AdminUser.password + '2'
			};

			const [noTokenAttemptRes, wrongCurrentPasswordAttemptRes] = await Promise.all([
				TestBed.http.post('/api/auth/updatepassword').send(noTokenAttempt),
				TestBed.http.post('/api/auth/updatepassword').send(wrongCurrentPasswordAttempt).set('Authorization', TestBed.AdminToken),
			]);

			// noTokenAttemptRes
			expect(noTokenAttemptRes).status(401);
			// expect(noTokenAttemptRes).to.have.property('body');
			// expect(noTokenAttemptRes.body).to.have.property('message');
			// expect(noTokenAttemptRes.body).property('message').to.equal(ROUTE_STATUS.UNAUTHORISED);

			// wrongCurrentPasswordAttemptRes
			expect(wrongCurrentPasswordAttemptRes).status(401);
			expect(wrongCurrentPasswordAttemptRes).to.have.property('body');
			expect(wrongCurrentPasswordAttemptRes.body).to.have.property('message');
			expect(wrongCurrentPasswordAttemptRes.body).property('message').to.equal(AUTH_STATUS.PASSWORD_DID_NOT_MATCH);
		});


		it('POST /api/auth/updatepassword 422', async () => {
			const noCurrentPassword = { password: AdminUser.password + '2', confirm: AdminUser.password + '2' };
			const noPassword = { currentPassword: AdminUser.password, confirm: AdminUser.password + '2' };
			const noConfirm = { currentPassword: AdminUser.password, password: AdminUser.password + '2' };
			const confirmMismatch = {
				currentPassword: AdminUser.password,
				password: AdminUser.password + '2', confirm: AdminUser.password + '3'
			};


			const [noCurrentPasswordRes, noPasswordRes, noConfirmRes, confirmMismatchRes] = await Promise.all([
				TestBed.http.post('/api/auth/updatepassword').send(noCurrentPassword).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/auth/updatepassword').send(noPassword).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/auth/updatepassword').send(noConfirm).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/auth/updatepassword').send(confirmMismatch).set('Authorization', TestBed.AdminToken)
			]);

			// noCurrentPasswordRes
			expect(noCurrentPasswordRes).to.have.status(422);
			expect(noCurrentPasswordRes).to.have.property('body');
			expect(noCurrentPasswordRes.body).to.have.property('message');
			expect(noCurrentPasswordRes.body.message).to.equal(VALIDATION_FAILED.USER_MODEL);
			expect(noCurrentPasswordRes.body).to.have.property('errors');
			expect(noCurrentPasswordRes.body.errors).to.be.an('array');
			expect(noCurrentPasswordRes.body.errors[0]).to.have.property('error');
			expect(noCurrentPasswordRes.body.errors[0]).to.have.property('params');
			expect(noCurrentPasswordRes.body.errors[0].params).to.have.property('missingProperty');
			expect(noCurrentPasswordRes.body.errors[0].params.missingProperty).to.equal('currentPassword');

			// noPasswordRes
			expect(noCurrentPasswordRes).to.have.status(422);

			// noConfirmRes
			expect(noCurrentPasswordRes).to.have.status(422);

			// confirmMismatchRes
			expect(noCurrentPasswordRes).to.have.status(422);
		});
	});

});

