import { expect } from 'chai';

import { ContentModel, Content } from '../src/models/content';
import { status, ROUTE_STATUS, CMS_STATUS, VALIDATION_FAILED, USERS_STATUS } from '../src/libs/validate';

import { TestBed, AdminUser, TestUser } from './testbed';
import { accessRoles } from '../src/models/user';

// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------


describe('REST: Admin', () => {

	// ---------------------------------
	// ------- /api/admin/users --------
	// ---------------------------------


	describe('/api/admin/users/', () => {

		it('GET /api/admin/users/ 200', async () => {
			const res = await TestBed.http.get('/api/admin/users/').set('Cookie', TestBed.AdminCookie);

			expect(res.body).to.be.an('array');
			expect(res.body[0]).to.have.property('_id'); // important to keep id here.
			expect(res.body[0]).to.have.property('username');
			expect(res.body[0]).to.have.property('createdAt');
			expect(res.body[0]).to.have.property('role');
		});

		it('GET /api/admin/users/ 401', async () => {
			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/admin/users/'),
				TestBed.http.get('/api/admin/users/').set('Cookie', TestBed.UserCookie),
				TestBed.http.get('/api/admin/users/').set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200); // this should be allowed.
		});

	});


	// ---------------------------------
	// ----- /api/admin/users/:id ------
	// ---------------------------------

	describe('/api/admin/users/:id', () => {

		it('PATCH /api/admin/users/:id 200', async () => {
			const patchUser = {
				_id: TestBed.User.id,
				username: TestBed.User.username,
				role: TestBed.User.role,
			};

			const res = await TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
				.set('Cookie', TestBed.AdminCookie)
				.send(patchUser);

			expect(res).to.have.status(200);
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(USERS_STATUS.USER_UPDATED);
		});

		it('PATCH /api/admin/users/:id 400', async () => {
			const patchUser = {
				_id: TestBed.AdminUser.id, // Using AdminUser's ID instead
				username: TestBed.User.username,
				role: TestBed.User.role,
			};

			const res = await TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
				.set('Cookie', TestBed.AdminCookie)
				.send(patchUser);

			expect(res).to.have.status(400);
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(USERS_STATUS.DATA_UNPROCESSABLE);
		});

		it('PATCH /api/admin/users/:id 401', async () => {

			const patchUser = {
				_id: TestBed.User.id,
				username: TestBed.User.username,
				role: TestBed.User.role,
			};

			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
					.send(patchUser),
				TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
					.set('Cookie', TestBed.UserCookie)
					.send(patchUser),
				TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(patchUser)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200);
		});

		it('PATCH /api/admin/users/:id 409', async () => {
			const patchUser = {
				_id: TestBed.User.id,
				username: TestBed.AdminUser.username, // Trying to use the admin user's username.
				role: TestBed.User.role,
			};

			const res = await TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
				.set('Cookie', TestBed.AdminCookie)
				.send(patchUser);

			expect(res).to.have.status(409);
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(USERS_STATUS.USERNAME_NOT_AVILIABLE);
		});

		it('PATCH /api/admin/users/:id 422', async () => {

			const idMissing = {
				username: TestBed.User.username,
				role: TestBed.User.role
			};
			const usernameMissing = {
				_id: TestBed.User.id,
				role: TestBed.User.role
			};
			const roleMissing = {
				_id: TestBed.User.id,
				username: TestBed.User.username
			};
			const tooManyProperties = {
				_id: TestBed.User.id,
				username: TestBed.User.username,
				role: TestBed.User.role,
				test: 'extra property'
			};

			const [idRes, userRes, roleRes, tooManyRes] = await Promise.all([
				TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(idMissing),
				TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(usernameMissing),
				TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(roleMissing),
				TestBed.http.patch('/api/admin/users/' + TestBed.User.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(tooManyProperties)
			]);

			expect(idRes).to.have.status(422);
			expect(idRes).to.have.property('body');
			expect(idRes.body).to.have.property('message');
			expect(idRes.body.message).to.equal(VALIDATION_FAILED.USER_MODEL);
			expect(idRes.body).to.have.property('errors');
			expect(idRes.body.errors).to.be.an('array');
			expect(idRes.body.errors[0]).to.have.property('error');
			expect(idRes.body.errors[0]).to.have.property('params');
			expect(idRes.body.errors[0].params).to.have.property('missingProperty');
			expect(idRes.body.errors[0].params.missingProperty).to.equal('_id');

			expect(userRes).to.have.status(422);
			expect(userRes.body.errors[0].params).to.have.property('missingProperty');
			expect(userRes.body.errors[0].params.missingProperty).to.equal('username');

			expect(roleRes).to.have.status(422);
			expect(roleRes.body.errors[0].params).to.have.property('missingProperty');
			expect(roleRes.body.errors[0].params.missingProperty).to.equal('role');

			expect(tooManyRes.body.errors).to.be.an('array');
			expect(tooManyRes.body.errors[0].params).to.have.property('additionalProperty');
			expect(tooManyRes.body.errors[0].params.additionalProperty).to.equal('test');
		});
	});


	// ---------------------------------
	// -------- /api/admin/cms ---------
	// ---------------------------------


	describe('/api/admin/cms/', () => {

		it('GET /api/admin/cms/ 200', async () => {

			const res = await TestBed.http.get('/api/admin/cms/').set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');
			expect(res.body[0]).to.have.property('title');
			expect(res.body[0]).to.have.property('route');
			expect(res.body[0]).to.have.property('views'); // admin only

		});

		it('GET /api/admin/cms/ 401', async () => {
			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/admin/cms/'),
				TestBed.http.get('/api/admin/cms/').set('Cookie', TestBed.UserCookie),
				TestBed.http.get('/api/admin/cms/').set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200);
		});
	});

	// ---------------------------------
	// ----- /api/admin/cms/:route -----
	// ---------------------------------

	describe('/api/admin/cms/:route', () => {

		it('GET /api/admin/cms/:route 200', async () => {
			const content: Content = {
				title: 'getadmin200',
				route: 'getadmin200',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie)
				.send(content);

			const res = await TestBed.http.get('/api/admin/cms/' + content.route).set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('published'); // admin only
			expect(res.body).to.have.property('route');
			expect(res.body.route).to.equal(content.route);
		});

		it('GET /api/admin/cms/:route 401', async () => {
			const content: Content = {
				title: 'getadmin401',
				route: 'getadmin401',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie)
				.send(content);

			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/admin/cms/' + content.route),
				TestBed.http.get('/api/admin/cms/' + content.route).set('Cookie', TestBed.UserCookie),
				TestBed.http.get('/api/admin/cms/' + content.route).set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200);
		});

		it('GET /api/admin/cms/:route 404', async () => {
			const res = await TestBed.http.get('/api/admin/cms/' + 'some404route').set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(404);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(CMS_STATUS.CONTENT_NOT_FOUND);
		});
	});

});
