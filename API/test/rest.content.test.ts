import { expect } from 'chai';

import { Content, AccessRoles } from '../types';
import { CMS_STATUS, VALIDATION_FAILED } from '../src/libs/validate';

import { TestBed } from './testbed';


// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------


describe('REST: Content', () => {

	// ---------------------------------
	// ----------- /api/cms/ -----------
	// ---------------------------------


	describe('/api/cms/', () => {
		it('POST /api/cms/ 200', async () => {

			const content: Content = {
				title: 'test',
				route: 'test',
				content: 'test',
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const res = await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie)
				.send(content);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('content');
			expect(res.body).property('content').to.equal(content.content); // valid; no sanitation needed

			const res2 = await TestBed.http.get('/api/cms/').set('Cookie', TestBed.AdminCookie);

			expect(res2).to.have.status(200);
			expect(res2).to.have.property('body');
			expect(res2.body).to.be.an('array');

			const resContent = (res2.body as Content[]).find(c => c.route === content.route);
			expect(resContent).to.have.property('route');
			expect(resContent).property('route').to.equal(content.route);
		});

		it('POST /api/cms/ 200, sanitation security', async () => {

			const content: Content = {
				title: 'test2',
				route: 'test/test//test\\test',
				content: `
          <h2>Hello World</h2>
          <p style="background:url('attack.site')">
            <img src="javascript:alert('Vulnerable');" />
            <a href="javascript:alert('Vulnerable');">evil</a>
          </p>
          <script>alert('Vulnerable');</script>
          <script src="/evil.js"></script>
          <a href="/acceptable">good</a>
          <img src="/acceptable.jpg" />`,
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const res = await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie)
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
			expect(res.body).property('content').to.not.contain('url');
			expect(res.body).property('content').to.not.contain('attack.site');

			expect(res.body).property('content').to.contain('<a href="/acceptable">good</a>');
			expect(res.body).property('content').to.contain('<img src="/acceptable.jpg" />');

			expect(res.body).have.property('route');
			expect(res.body).property('route').to.not.contain('/');
			expect(res.body).property('route').to.not.contain('\\');
		});

		it('POST /api/cms/ 200, sanitation formatting', async () => {

			const content: Content = {
				title: 'test sanitation',
				route: 'test sanitation',
				content:
`<p class="test">
	<span style="color:#ffffff">fsdfdsfds</span>
</p>
<p>
	<span style="color:hsl(150,75%,60%)">fsfds</span>
</p>
<p style="text-align:right">fdsdsfsd</p>
<p>
	<span style="color:hsl(240,75%,60%)">fsdfds</span>
</p>`,
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const res = await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie)
				.send(content);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');

			expect(res.body).have.property('content');
			expect(res.body).property('content').to.contain('class="test"');
			expect(res.body).property('content').to.contain('style="color:#ffffff"');
			expect(res.body).property('content').to.contain('style="text-align:right"');
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
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			const badRoute = Object.assign({}, properContent);
			delete badRoute.route;

			const badEverything = Object.assign({}, properContent);
			delete badEverything.route;
			delete badEverything.title;
			delete badEverything.content;
			delete badEverything.description;
			delete badEverything.published;

			const [badRouteRes, badEverythingRes] = await Promise.all([
				TestBed.http.post('/api/cms').send(badRoute).set('Cookie', TestBed.AdminCookie),
				TestBed.http.post('/api/cms').send(badEverything).set('Cookie', TestBed.AdminCookie)
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

			// badEverythingRes
			expect(badEverythingRes).to.have.status(422);
			expect(badEverythingRes.body.errors.length).to.equal(5);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'route')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'title')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'content')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'description')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'published')).to.not.equal(null);
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
				access: [AccessRoles.member], // MEMBER RIGHTS REQUIRED
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie)
				.send(content);

			const [noAuthRes, memberRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/'),
				TestBed.http.get('/api/cms/').set('Cookie', TestBed.MemberCookie),
				TestBed.http.get('/api/cms/').set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(200);
			expect(noAuthRes).to.have.property('body');
			expect(noAuthRes.body).to.be.an('array');
			// Should not show up for unauthed.
			expect((noAuthRes.body as Content[]).filter(list => list.route === content.route)).to.be.of.length(0);


			expect(memberRes).to.have.status(200);
			expect(memberRes).to.have.property('body');
			expect(memberRes.body).to.be.an('array');
			// should show up for members
			expect((memberRes.body as Content[]).filter(list => list.route === content.route)).to.be.of.length(1);

			expect(adminRes).to.have.status(200);
			expect(adminRes).to.have.property('body');
			expect(adminRes.body).to.be.an('array');
			// should also show up for admins
			expect((adminRes.body as Content[]).filter(list => list.route === content.route)).to.be.of.length(1);
		});

		it('GET /api/cms/ 200, admin', async () => {
			const content: Content = {
				title: 'list200admin',
				route: 'list200admin',
				content: 'test',
				access: [AccessRoles.admin], // ADMIN RIGHTS REQUIRED
				description: 'test',
				folder: 'test',
				published: true,
				nav: true,
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie)
				.send(content);

			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/'),
				TestBed.http.get('/api/cms/').set('Cookie', TestBed.MemberCookie),
				TestBed.http.get('/api/cms/').set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(200);
			expect(noAuthRes).to.have.property('body');
			expect(noAuthRes.body).to.be.an('array');
			// Should not show up for unauthed.
			expect((noAuthRes.body as Content[]).filter(list => list.route === content.route)).to.be.of.length(0);


			expect(userRes).to.have.status(200);
			expect(userRes).to.have.property('body');
			expect(userRes.body).to.be.an('array');
			// nor for users
			expect((userRes.body as Content[]).filter(list => list.route === content.route)).to.be.of.length(0);

			expect(adminRes).to.have.status(200);
			expect(adminRes).to.have.property('body');
			expect(adminRes.body).to.be.an('array');
			// but should show up for admins
			expect((adminRes.body as Content[]).filter(list => list.route === content.route)).to.be.of.length(1);
		});

	});

	// ---------------------------------
	// -------- /api/cms/:route --------
	// ---------------------------------

	describe('/api/cms/:route', () => {
		it('GET /api/cms/:route 200', async () => {

			const testRoute = 'test';

			const res = await TestBed.http.get('/api/cms/' + testRoute).set('Cookie', TestBed.Admin2Cookie);

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
				access: [AccessRoles.member], // member role
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.Admin2Cookie) // admin 2 creates
				.send(content);


			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/' + content.route),
				TestBed.http.get('/api/cms/' + content.route).set('Cookie', TestBed.MemberCookie),
				TestBed.http.get('/api/cms/' + content.route).set('Cookie', TestBed.AdminCookie)
			]);

			// Unauthorized should return 401
			expect(noAuthRes).to.have.status(401);

			// The auth'd requests should have access
			expect(userRes).to.have.status(200);
			expect(userRes).to.have.property('body');
			expect(userRes.body).to.have.property('route');
			expect(userRes.body).property('route').to.equal(content.route);
			expect(userRes.body).to.have.property('content');
			expect(userRes.body).property('content').to.equal(content.content);

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
				access: [AccessRoles.admin], // admin role
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.Admin2Cookie) // admin 2 creates
				.send(content);


			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/cms/' + content.route),
				TestBed.http.get('/api/cms/' + content.route).set('Cookie', TestBed.MemberCookie),
				TestBed.http.get('/api/cms/' + content.route).set('Cookie', TestBed.AdminCookie)
			]);

			// Unauthorized should return 401
			expect(noAuthRes).to.have.status(401);
			// and so should normal users
			expect(userRes).to.have.status(401);

			// but Admin should have access
			expect(adminRes).to.have.status(200);
			expect(adminRes).to.have.property('body');
			expect(adminRes.body).to.have.property('route');
			expect(adminRes.body).property('route').to.equal(content.route);
			expect(adminRes.body).to.have.property('content');
			expect(adminRes.body).property('content').to.equal(content.content);
		});

		it('GET /api/cms/:route 200, writer specialcase', async () => {
			const content: Content = {
				title: 'get200writerSpecialcase',
				route: 'get200writerspecialcase',
				content: 'test',
				access: [AccessRoles.member], // member role!! <-- important
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.WriterCookie) // Writer (without member role)
				.send(content);

			// fetch this very route as the writer (who by by content.access has no access, but by author
			// and by having the writer role does)
			const res = await TestBed.http.get('/api/cms/' + content.route).set('Cookie', TestBed.WriterCookie);

			// Should have access!!
			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('route');
			expect(res.body).property('route').to.equal(content.route);
			expect(res.body).to.have.property('content');
			expect(res.body).property('content').to.equal(content.content);
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
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie) // admin creates
				.send(content);

			const patchRes = await TestBed.http.patch('/api/cms/' + content.route)
				.set('Cookie', TestBed.AdminCookie) // admin patch
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
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie) // admin creates
				.send(content);

			const [noAuthRes, userRes] = await Promise.all([
				TestBed.http.patch('/api/cms/' + content.route).send(content),
				TestBed.http.patch('/api/cms/' + content.route).set('Cookie', TestBed.MemberCookie).send(content)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
		});

		it('PATCH /api/cms/:route 404', async () => {
			const route = 'some404route';

			const content: Content = {
				title: 'some404route',
				route,
				content: 'test',
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const res = await TestBed.http.patch('/api/cms/' + route)
				.set('Cookie', TestBed.AdminCookie)
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
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const badRoute = Object.assign({}, properContent);
			delete badRoute.route;
			const badEverything = Object.assign({}, properContent);
			delete badEverything.route;
			delete badEverything.title;
			delete badEverything.content;
			delete badEverything.description;
			delete badEverything.published;


			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie) // admin creates
				.send(properContent);

			const [badRouteRes, badEverythingRes] = await Promise.all([
				TestBed.http.patch('/api/cms/' + properContent.route).send(badRoute).set('Cookie', TestBed.AdminCookie),
				TestBed.http.patch('/api/cms/' + properContent.route).send(badEverything).set('Cookie', TestBed.AdminCookie)
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

			// badEverythingRes
			expect(badEverythingRes).to.have.status(422);
			expect(badEverythingRes.body.errors.length).to.equal(5);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'route')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'title')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'content')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'description')).to.not.equal(null);
			expect(badEverythingRes.body.errors.find((e: any) => e.params.missingProperty === 'published')).to.not.equal(null);
		});


		it('DELETE /api/cms/:route 200', async () => {
			const content: Content = {
				title: 'delete200',
				route: 'delete200',
				content: 'test',
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie) // admin creates
				.send(content);

			const delRes = await TestBed.http.del('/api/cms/' + content.route).set('Cookie', TestBed.AdminCookie);

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
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie) // admin creates
				.send(content);

			const [noAuthRes, userRes] = await Promise.all([
				TestBed.http.del('/api/cms/' + content.route).send(content),
				TestBed.http.del('/api/cms/' + content.route).set('Cookie', TestBed.MemberCookie).send(content)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
		});

		it('DELETE /api/cms/:route 404', async () => {
			const route = 'some404route';
			const delRes = await TestBed.http.del('/api/cms/' + route).set('Cookie', TestBed.AdminCookie);

			expect(delRes).to.have.status(404);
			expect(delRes).to.have.property('body');
			expect(delRes.body).to.have.property('message');
			expect(delRes.body.message).to.equal(CMS_STATUS.CONTENT_NOT_FOUND);
		});
	});
});
