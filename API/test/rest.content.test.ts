import { expect } from 'chai';

import { ContentModel, Content } from '../src/models/content';
import { accessRoles } from '../src/models/user';

import { status, ROUTE_STATUS, CMS_STATUS, VALIDATION_FAILED } from '../src/libs/validate';

import { TestBed, AdminUser } from './testbed';


// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------


describe('REST: Content', () => {
	before(async () => {
		await ContentModel.remove({}).exec();
	});


	// ---------------------------------
	// ----------- /api/cms/ -----------
	// ---------------------------------


	describe('/api/cms/', () => {
		it('POST /api/cms/ 200', async () => {

			const content: Content = {
				title: 'test',
				route: 'test',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const res = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken)
				.send(content);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('content');
			expect(res.body).property('content').to.equal(content.content); // valid; no sanitation needed

			const res2 = await TestBed.http.get('/api/cms/').set('Authorization', TestBed.AdminToken);
			expect(res2).to.have.status(200);
			expect(res2).to.have.property('body');
			expect(res2.body).to.be.an('array');
			expect(res2.body[0]).to.have.property('route');
			expect(res2.body[0]).property('route').to.equal(content.route);
		});

		it('POST /api/cms/ 200, sanitation', async () => {

			const content: Content = {
				title: 'test2',
				route: 'test/test//test\\test',
				content: `
          <h2>Hello World</h2>
          <p>
            <img src="javascript:alert('Vulnerable');" />
            <a href="javascript:alert('Vulnerable');">evil</a>
          </p>
          <script>alert('Vulnerable');</script>
          <script src="/evil.js"></script>
          <a href="/acceptable">good</a>
          <img src="/acceptable.jpg" />`,
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const res = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken)
				.send(content);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');

			expect(res.body).have.property('content');
			expect(res.body).property('content').to.not.contain('javascript');
			expect(res.body).property('content').to.not.contain('alert');
			expect(res.body).property('content').to.not.contain('Vulnerable');
			expect(res.body).property('content').to.not.contain('<script>');
			expect(res.body).property('content').to.not.contain('evil.js');

			expect(res.body).property('content').to.contain('<a href="/acceptable">good</a>');
			expect(res.body).property('content').to.contain('<img src="/acceptable.jpg" />');

			expect(res.body).have.property('route');
			expect(res.body).property('route').to.not.contain('/');
			expect(res.body).property('route').to.not.contain('\\');
		});

		it('POST /api/cms/ 401', async () => {
			// unauthorized when no AdminToken is provided
			const res = await TestBed.http.post('/api/cms/').send({});
			// .set('Authorization', TestBed.AdminToken)
			expect(res).to.have.status(401);
		});

		it('POST /api/cms/ 422', async () => {

			const properContent: Content = {
				title: 'test3',
				route: 'test3',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			const badRoute = Object.assign({}, properContent);
			delete badRoute.route;

			const badTitle = Object.assign({}, properContent);
			delete badTitle.title;

			const badContent = Object.assign({}, properContent);
			delete badContent.content;

			const badDesc = Object.assign({}, properContent);
			delete badDesc.description;

			const badPublished = Object.assign({}, properContent);
			delete badPublished.published;


			const [badRouteRes, badTitleRes, badContentRes, badDescRes, badPublishedRes] = await Promise.all([
				TestBed.http.post('/api/cms').send(badRoute).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/cms').send(badTitle).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/cms').send(badContent).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/cms').send(badDesc).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/cms').send(badPublished).set('Authorization', TestBed.AdminToken)
			]);

			// badRouteRes
			expect(badRouteRes).to.have.status(422);
			expect(badRouteRes).to.have.property('body');
			expect(badRouteRes.body).to.have.property('message');
			expect(badRouteRes.body.message).to.equal(VALIDATION_FAILED.CONTENT_MODEL);
			expect(badRouteRes.body).to.have.property('errors');
			expect(badRouteRes.body.errors).to.be.an('array');
			expect(badRouteRes.body.errors[0]).to.have.property('error');
			expect(badRouteRes.body.errors[0]).to.have.property('params');
			expect(badRouteRes.body.errors[0].params).to.have.property('missingProperty');
			expect(badRouteRes.body.errors[0].params.missingProperty).to.equal('route');

			// badTitleRes
			expect(badTitleRes).to.have.status(422);
			// badContentRes
			expect(badContentRes).to.have.status(422);
			// badDescRes
			expect(badDescRes).to.have.status(422);
			// badPublished
			expect(badPublishedRes).to.have.status(422);
		});

		it('GET /api/cms/ 200', async () => {
			const res = await TestBed.http.get('/api/cms/'); // access everyone

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');
			expect(res.body[0]).to.have.property('title');
			expect(res.body[0]).to.have.property('route');
		});

		it('GET /api/cms/ 200, member', async () => {
			const content: Content = {
				title: 'list200member',
				route: 'list200member',
				content: 'test',
				access: accessRoles.user, // USER RIGHTS REQUIRED
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken)
				.send(content);

			const [noAuthRes, memberRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/'),
				TestBed.http.get('/api/cms/').set('Authorization', TestBed.MemberToken),
				TestBed.http.get('/api/cms/').set('Authorization', TestBed.AdminToken)
			]);

			expect(noAuthRes).to.have.status(200);
			expect(noAuthRes).to.have.property('body');
			expect(noAuthRes.body).to.be.an('array');
			// Should not show up for unauthed.
			expect((<Content[]>noAuthRes.body).filter(list => list.route === content.route)).to.be.of.length(0);


			expect(memberRes).to.have.status(200);
			expect(memberRes).to.have.property('body');
			expect(memberRes.body).to.be.an('array');
			// should show up for users
			expect((<Content[]>memberRes.body).filter(list => list.route === content.route)).to.be.of.length(1);

			expect(adminRes).to.have.status(200);
			expect(adminRes).to.have.property('body');
			expect(adminRes.body).to.be.an('array');
			// should also show up for admins
			expect((<Content[]>adminRes.body).filter(list => list.route === content.route)).to.be.of.length(1);
		});

		it('GET /api/cms/ 200, admin', async () => {
			const content: Content = {
				title: 'list200admin',
				route: 'list200admin',
				content: 'test',
				access: accessRoles.admin, // ADMIN RIGHTS REQUIRED
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken)
				.send(content);

			const [noAuthRes, memberRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/'),
				TestBed.http.get('/api/cms/').set('Authorization', TestBed.MemberToken),
				TestBed.http.get('/api/cms/').set('Authorization', TestBed.AdminToken)
			]);

			expect(noAuthRes).to.have.status(200);
			expect(noAuthRes).to.have.property('body');
			expect(noAuthRes.body).to.be.an('array');
			// Should not show up for unauthed.
			expect((<Content[]>noAuthRes.body).filter(list => list.route === content.route)).to.be.of.length(0);


			expect(memberRes).to.have.status(200);
			expect(memberRes).to.have.property('body');
			expect(memberRes.body).to.be.an('array');
			// nor for users
			expect((<Content[]>memberRes.body).filter(list => list.route === content.route)).to.be.of.length(0);

			expect(adminRes).to.have.status(200);
			expect(adminRes).to.have.property('body');
			expect(adminRes.body).to.be.an('array');
			// but should show up for admins
			expect((<Content[]>adminRes.body).filter(list => list.route === content.route)).to.be.of.length(1);
		});

	});

	// ---------------------------------
	// -------- /api/cms/:route --------
	// ---------------------------------

	describe('/api/cms/:route', () => {
		it('GET /api/cms/:route 200', async () => {

			const testRoute = 'test';

			const res = await TestBed.http.get('/api/cms/' + testRoute).set('Authorization', TestBed.AdminToken);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('route');
			expect(res.body).property('route').to.equal(testRoute);
			expect(res.body).to.have.property('content');
			expect(res.body).property('content').to.equal('test');
		});

		it('GET /api/cms/:route 200, member', async () => {
			const content: Content = {
				title: 'get200member',
				route: 'get200member',
				content: 'test',
				access: accessRoles.user, // user role
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(content);


			const [noAuthRes, memberRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/' + content.route),
				TestBed.http.get('/api/cms/' + content.route).set('Authorization', TestBed.MemberToken),
				TestBed.http.get('/api/cms/' + content.route).set('Authorization', TestBed.AdminToken)
			]);

			// Unauthorized should return 401
			expect(noAuthRes).to.have.status(401);

			// The auth'd requests should have access
			expect(memberRes).to.have.status(200);
			expect(memberRes).to.have.property('body');
			expect(memberRes.body).to.have.property('route');
			expect(memberRes.body).property('route').to.equal(content.route);
			expect(memberRes.body).to.have.property('content');
			expect(memberRes.body).property('content').to.equal(content.content);

			// and so should admins
			expect(adminRes).to.have.status(200);
			expect(adminRes).to.have.property('body');
			expect(adminRes.body).to.have.property('route');
			expect(adminRes.body).property('route').to.equal('get200member');
			expect(adminRes.body).to.have.property('content');
			expect(adminRes.body).property('content').to.equal('test');
		});

		it('GET /api/cms/:route 200, admin', async () => {
			const content: Content = {
				title: 'get200admin',
				route: 'get200admin',
				content: 'test',
				access: accessRoles.admin, // admin role
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(content);


			const [noAuthRes, memberRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/' + content.route),
				TestBed.http.get('/api/cms/' + content.route).set('Authorization', TestBed.MemberToken),
				TestBed.http.get('/api/cms/' + content.route).set('Authorization', TestBed.AdminToken)
			]);

			// Unauthorized should return 401
			expect(noAuthRes).to.have.status(401);
			// and so should normal members
			expect(memberRes).to.have.status(401);

			// but Admin should have access
			expect(adminRes).to.have.status(200);
			expect(adminRes).to.have.property('body');
			expect(adminRes.body).to.have.property('route');
			expect(adminRes.body).property('route').to.equal(content.route);
			expect(adminRes.body).to.have.property('content');
			expect(adminRes.body).property('content').to.equal(content.content);
		});

		it('GET /api/cms/:route 404', async () => {
			const res = await TestBed.http.get('/api/cms/' + 'some404route');

			expect(res).to.have.status(404);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(CMS_STATUS.CONTENT_NOT_FOUND);
		});




		it('PATCH /api/cms/:route 200', async () => {
			const content: Content = {
				title: 'patch200',
				route: 'patch200',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(content);

			const patchRes = await TestBed.http.patch('/api/cms/' + content.route)
				.set('Authorization', TestBed.AdminToken) // admin patch
				.send(content);

			expect(patchRes).to.have.status(200);
			expect(patchRes).to.have.property('body');
			expect(patchRes.body).to.have.property('route');
			expect(patchRes.body).property('route').to.equal(content.route);
			expect(patchRes.body).to.have.property('content');
			expect(patchRes.body).property('content').to.equal(content.content);
		});

		it('PATCH /api/cms/:route 401', async () => {
			const content: Content = {
				title: 'patch401',
				route: 'patch401',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(content);

			const [noAuthRes, memberRes] = await Promise.all([
				TestBed.http.patch('/api/cms/' + content.route).send(content),
				TestBed.http.patch('/api/cms/' + content.route).set('Authorization', TestBed.MemberToken).send(content)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(memberRes).to.have.status(401);
		});

		it('PATCH /api/cms/:route 404', async () => {
			const route = 'some404route';

			const content: Content = {
				title: 'some404route',
				route: route,
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const res = await TestBed.http.patch('/api/cms/' + route)
				.set('Authorization', TestBed.AdminToken)
				.send(content);

			expect(res).to.have.status(404);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(CMS_STATUS.CONTENT_NOT_FOUND);
		});

		it('PATCH /api/cms/:route 422', async () => {
			const properContent: Content = {
				title: 'patch422',
				route: 'patch422',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const badRoute = Object.assign({}, properContent);
			delete badRoute.route;

			const badTitle = Object.assign({}, properContent);
			delete badTitle.title;

			const badContent = Object.assign({}, properContent);
			delete badContent.content;

			const badDesc = Object.assign({}, properContent);
			delete badDesc.description;

			const badPublished = Object.assign({}, properContent);
			delete badPublished.published;


			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(properContent);

			const [badRouteRes, badTitleRes, badContentRes, badDescRes, badPublishedRes] = await Promise.all([
				TestBed.http.patch('/api/cms/' + properContent.route).send(badRoute).set('Authorization', TestBed.AdminToken),
				TestBed.http.patch('/api/cms/' + properContent.route).send(badTitle).set('Authorization', TestBed.AdminToken),
				TestBed.http.patch('/api/cms/' + properContent.route).send(badContent).set('Authorization', TestBed.AdminToken),
				TestBed.http.patch('/api/cms/' + properContent.route).send(badDesc).set('Authorization', TestBed.AdminToken),
				TestBed.http.patch('/api/cms/' + properContent.route).send(badPublished).set('Authorization', TestBed.AdminToken)
			]);

			// badRouteRes
			expect(badRouteRes).to.have.status(422);
			expect(badRouteRes).to.have.property('body');
			expect(badRouteRes.body).to.have.property('message');
			expect(badRouteRes.body.message).to.equal(VALIDATION_FAILED.CONTENT_MODEL);
			expect(badRouteRes.body).to.have.property('errors');
			expect(badRouteRes.body.errors).to.be.an('array');
			expect(badRouteRes.body.errors[0]).to.have.property('error');
			expect(badRouteRes.body.errors[0]).to.have.property('params');
			expect(badRouteRes.body.errors[0].params).to.have.property('missingProperty');
			expect(badRouteRes.body.errors[0].params.missingProperty).to.equal('route');

			// badTitleRes
			expect(badTitleRes).to.have.status(422);
			// badContentRes
			expect(badContentRes).to.have.status(422);
			// badDescRes
			expect(badDescRes).to.have.status(422);
			// badPublished
			expect(badPublishedRes).to.have.status(422);
		});


		it('DELETE /api/cms/:route 200', async () => {
			const content: Content = {
				title: 'delete200',
				route: 'delete200',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(content);

			const delRes = await TestBed.http.del('/api/cms/' + content.route).set('Authorization', TestBed.AdminToken);

			expect(delRes).to.have.status(200);
			expect(delRes).to.have.property('body');
			expect(delRes.body).to.have.property('message');
			expect(delRes.body.message).to.equal(CMS_STATUS.CONTENT_DELETED);
		});

		it('DELETE /api/cms/:route 401', async () => {
			const content: Content = {
				title: 'delete401',
				route: 'delete401',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(content);

			const [noAuthRes, memberRes] = await Promise.all([
				TestBed.http.del('/api/cms/' + content.route).send(content),
				TestBed.http.del('/api/cms/' + content.route).set('Authorization', TestBed.MemberToken).send(content)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(memberRes).to.have.status(401);
		});

		it('DELETE /api/cms/:route 404', async () => {
			const route = 'some404route';
			const delRes = await TestBed.http.del('/api/cms/' + route).set('Authorization', TestBed.AdminToken);

			expect(delRes).to.have.status(404);
			expect(delRes).to.have.property('body');
			expect(delRes.body).to.have.property('message');
			expect(delRes.body.message).to.equal(CMS_STATUS.CONTENT_NOT_FOUND);
		});
	});


	// ---------------------------------
	// ---- /api/cms/history/:route ----
	// ---------------------------------

	describe('/api/cms/history/:route', () => {
		it('GET /api/cms/history/:route 200', async () => {
			const content: Content = {
				title: 'history',
				route: 'history',
				content: 'test',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const patched: Content = {
				title: 'history',
				route: 'history',
				content: 'new patched content',
				access: accessRoles.everyone,
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const postRes = await TestBed.http.post('/api/cms/')
				.set('Authorization', TestBed.AdminToken) // admin creates
				.send(content);


			const patchRes = await TestBed.http.patch('/api/cms/' + content.route)
				.set('Authorization', TestBed.AdminToken) // admin patches
				.send(patched);

			const getRes = await TestBed.http.get('/api/cms/history/' + content.route).set('Authorization', TestBed.AdminToken); // get as admin

			expect(getRes).to.have.status(200);
			expect(getRes).to.have.property('body');
			expect(getRes.body).to.be.an('array');
			expect(getRes.body[0]).to.have.property('route');
			expect(getRes.body[0]).property('route').to.equal(content.route);
			expect(getRes.body[0]).to.have.property('content');
			expect(getRes.body[0]).property('content').to.equal(content.content); // content = original. NOT equal to the patched version
		});

		it('GET /api/cms/history/:route 401', async () => {
			const route = 'history';
			const [noAuthRes, memberRes] = await Promise.all([
				TestBed.http.get('/api/cms/history/' + route),
				TestBed.http.get('/api/cms/history/' + route).set('Authorization', TestBed.MemberToken)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(memberRes).to.have.status(401);
		});

	});


	// ---------------------------------
	// -- /api/cms/search/:searchTerm --
	// ---------------------------------


	describe('/api/cms/search/:searchTerm', () => {
		it('GET /api/cms/search/:searchTerm 200', async () => {
			const list = [];

			for (let i = 0; i < 5; i++) {
				list.push(TestBed.http.post('/api/cms/').set('Authorization', TestBed.AdminToken).send({
					title: 'search' + i,
					route: 'search' + i,
					content: 'search',
					access: accessRoles.everyone, // FOR EVERYONE
					description: 'search',
					folder: 'test',
					published: true,
					nav: true
				}));

				list.push(TestBed.http.post('/api/cms/').set('Authorization', TestBed.AdminToken).send({
					title: 'searchUser' + i,
					route: 'searchUser' + i,
					content: 'search',
					access: accessRoles.user, // USER RIGHTS REQUIRED
					description: 'search',
					folder: 'test',
					published: true,
					nav: true
				}));

				list.push(TestBed.http.post('/api/cms/').set('Authorization', TestBed.AdminToken).send({
					title: 'searchAdmin' + i,
					route: 'searchAdmin' + i,
					content: 'search',
					access: accessRoles.admin, // ADMIN RIGHTS REQUIRED
					description: 'search',
					folder: 'test',
					published: true,
					nav: true
				}));
			}


			const postResponses = await Promise.all(list);

			const searchTerm = 'search';

			const [noAuthRes, memberRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/search/' + searchTerm),
				TestBed.http.get('/api/cms/search/' + searchTerm).set('Authorization', TestBed.MemberToken),
				TestBed.http.get('/api/cms/search/' + searchTerm).set('Authorization', TestBed.AdminToken)
			]);

			expect(noAuthRes).to.have.status(200);
			expect(noAuthRes).to.have.property('body');
			expect(noAuthRes.body).to.be.an('array');
			expect(noAuthRes.body[0]).to.have.property('route');
			expect(noAuthRes.body[0]).to.have.property('description');
			expect(noAuthRes.body[0]).to.have.property('relevance');
			expect(noAuthRes.body[0]).to.have.property('views');
			expect(noAuthRes.body[0]).to.have.property('access');
			expect(noAuthRes.body).to.be.of.length(5);

			expect(memberRes).to.have.status(200);
			expect(memberRes.body).to.be.of.length(10);

			expect(adminRes).to.have.status(200);
			expect(adminRes.body).to.be.of.length(15);
		});


		it('GET /api/cms/search/:searchTerm 200, empty', async () => {
			const searchTerm = 'does not exist';
			const res = await TestBed.http.get('/api/cms/search/' + searchTerm);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(CMS_STATUS.SEARCH_RESULT_NONE_FOUND);
		});

	});

});
