import { expect } from 'chai';

import { ContentModel } from '../src/models';
import { Content, AccessRoles, AggregationQuery, JWTUser } from '../types';
import { CMS_STATUS, VALIDATION_FAILED, USERS_STATUS, ADMIN_STATUS } from '../src/libs/validate';

import { TestBed } from './testbed';

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
			expect(res.body[0]).to.have.property('roles');
		});

		it('GET /api/admin/users/ 401', async () => {
			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/admin/users/'),
				TestBed.http.get('/api/admin/users/').set('Cookie', TestBed.MemberCookie),
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
			const patchUser: JWTUser = {
				_id: TestBed.Member.id,
				username: TestBed.Member.username,
				roles: TestBed.Member.roles,
			};

			const res = await TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
				.set('Cookie', TestBed.AdminCookie)
				.send(patchUser);

			expect(res).to.have.status(200);
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(USERS_STATUS.USER_UPDATED);
		});

		it('PATCH /api/admin/users/:id 400', async () => {
			const patchUser: JWTUser = {
				_id: TestBed.AdminUser.id, // Using AdminUser's ID instead
				username: TestBed.Member.username,
				roles: TestBed.Member.roles,
			};

			const res = await TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
				.set('Cookie', TestBed.AdminCookie)
				.send(patchUser);

			expect(res).to.have.status(400);
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(USERS_STATUS.DATA_UNPROCESSABLE);
		});

		it('PATCH /api/admin/users/:id 401', async () => {

			const patchUser: JWTUser = {
				_id: TestBed.Member.id,
				username: TestBed.Member.username,
				roles: TestBed.Member.roles,
			};

			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
					.send(patchUser),
				TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
					.set('Cookie', TestBed.MemberCookie)
					.send(patchUser),
				TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(patchUser)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200);
		});

		it('PATCH /api/admin/users/:id 409', async () => {
			const patchUser: JWTUser = {
				_id: TestBed.Member.id,
				username: TestBed.AdminUser.username, // Trying to use the admin user's username.
				roles: TestBed.Member.roles,
			};

			const res = await TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
				.set('Cookie', TestBed.AdminCookie)
				.send(patchUser);

			expect(res).to.have.status(409);
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(USERS_STATUS.USERNAME_NOT_AVILIABLE);
		});

		it('PATCH /api/admin/users/:id 422', async () => {

			const idMissing: Partial<JWTUser> = {
				username: TestBed.Member.username,
				roles: TestBed.Member.roles
			};
			const usernameMissing: Partial<JWTUser> = {
				_id: TestBed.Member.id,
				roles: TestBed.Member.roles
			};
			const roleMissing: Partial<JWTUser> = {
				_id: TestBed.Member.id,
				username: TestBed.Member.username
			};
			const tooManyProperties: { test: string } & JWTUser = {
				_id: TestBed.Member.id,
				username: TestBed.Member.username,
				roles: TestBed.Member.roles,
				test: 'extra property'
			};

			const [idRes, userRes, roleRes, tooManyRes] = await Promise.all([
				TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(idMissing),
				TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(usernameMissing),
				TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
					.set('Cookie', TestBed.AdminCookie)
					.send(roleMissing),
				TestBed.http.patch('/api/admin/users/' + TestBed.Member.id)
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
			expect(roleRes.body.errors[0].params.missingProperty).to.equal('roles');

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
				TestBed.http.get('/api/admin/cms/').set('Cookie', TestBed.MemberCookie),
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
				access: [],
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
				access: [],
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
				TestBed.http.get('/api/admin/cms/' + content.route).set('Cookie', TestBed.MemberCookie),
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

	// ---------------------------------
	// --- /api/admin/cms/aggregate ----
	// ---------------------------------

	describe('/api/admin/cms/aggregate', () => {
		it('POST /api/admin/cms/aggregate 200, empty query', async () => {
			const query: AggregationQuery = {};

			const [res, allPagesRes] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query),
				TestBed.http.get('/api/admin/cms/').set('Cookie', TestBed.AdminCookie)
			]);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');

			const allPagesCount = (<Content[]>allPagesRes.body).length;
			const resCount = (<any[]>res.body).length;

			expect(resCount).to.equal(allPagesCount, 'should not have filtered anything');
		});

		it('POST /api/admin/cms/aggregate 200, route only', async () => {
			const route = 'getadmin200';
			const query: AggregationQuery = { route: route };

			const [res, allPagesRes] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query),
				TestBed.http.get('/api/admin/cms/').set('Cookie', TestBed.AdminCookie)
			]);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');

			const filteredAllPagesCount = (<Content[]>allPagesRes.body).filter(c => c.route === route).length;
			const resCount = (<any[]>res.body).length;

			expect(resCount).to.equal(filteredAllPagesCount, 'should have filtered based on route');
		});

		it('POST /api/admin/cms/aggregate 200, folder only', async () => {
			const folder = 'test';
			const query: AggregationQuery = { folder: folder };

			const [res, allPagesRes] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query),
				TestBed.http.get('/api/admin/cms/').set('Cookie', TestBed.AdminCookie)
			]);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');

			const filteredAllPagesCount = (<Content[]>allPagesRes.body).filter(c => c.folder === folder).length;
			const resCount = (<any[]>res.body).length;

			expect(resCount).to.equal(filteredAllPagesCount, 'should have filtered based on folder');
		});

		it('POST /api/admin/cms/aggregate 200, created after only', async () => {
			const afterDate = new Date();

			const content: Content = {
				title: 'aggregDate', route: 'aggregdate', content: 'test', access: [],
				description: 'test', folder: 'test', published: true, nav: true
			};

			const contentRes = await TestBed.http.post('/api/cms/').set('Cookie', TestBed.AdminCookie).send(content);
			expect(contentRes).to.have.status(200);

			const afterDate2 = new Date();

			const queryAfter: AggregationQuery = { createdAfterDate: afterDate };
			const queryAfter2: AggregationQuery = { createdAfterDate: afterDate2 };

			const [resAfter, resAfter2] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAfter),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAfter2)
			]);

			expect(resAfter).to.have.status(200);
			expect(resAfter).to.have.property('body');
			expect(resAfter.body).to.be.an('array');
			const contentFind = (<any[]>resAfter.body).find((c: any) => c.route === content.route);
			expect(contentFind).to.not.be.an('undefined'); // to NOT be.
			expect(contentFind.title).to.equal(content.title);

			// the second after was created AFTER the new content, and should thus not include the content we POSTed above
			expect(resAfter2).to.have.status(200);
			expect(resAfter2).to.have.property('body');
			expect(resAfter2.body).to.have.property('message');
			expect(resAfter2.body.message).to.equal(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND);
		});

		it('POST /api/admin/cms/aggregate 200, created before only', async () => {
			const beforeDate = new Date();

			const content: Content = {
				title: 'aggregDateBefore', route: 'aggregdatebefore', content: 'test', access: [],
				description: 'test', folder: 'test', published: true, nav: true
			};

			const contentRes = await TestBed.http.post('/api/cms/').set('Cookie', TestBed.AdminCookie).send(content);
			expect(contentRes).to.have.status(200);

			const beforeDate2 = new Date();

			const queryBefore: AggregationQuery = { createdBeforeDate: beforeDate };
			const queryBefore2: AggregationQuery = { createdBeforeDate: beforeDate2 };

			const [resBefore, resBefore2] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryBefore),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryBefore2)
			]);

			expect(resBefore).to.have.status(200);
			expect(resBefore).to.have.property('body');
			expect(resBefore.body).to.be.an('array');
			const contentFind = (<any[]>resBefore.body).find((c: any) => c.route === content.route);
			expect(contentFind).to.be.an('undefined'); // to ACTUALLY be undefined.

			// the second before was created AFTER the new content, and should thus include the content we POSTed above
			expect(resBefore2).to.have.status(200);
			expect(resBefore2).to.have.property('body');
			expect(resBefore2.body).to.be.an('array');
			const contentFind2 = (<any[]>resBefore2.body).find((c: any) => c.route === content.route);
			expect(contentFind2).to.not.be.an('undefined'); // to NOT be undefined.
			expect(contentFind2.title).to.equal(content.title);

			expect(resBefore.body.length).to.be.equal(resBefore2.body.length - 1);
		});

		it('POST /api/admin/cms/aggregate 200, written by only', async () => {
			const content: Content = {
				title: 'writtenByAdmin2', route: 'writtenbyadmin2',
				content: 'test', access: [],
				description: 'test', folder: 'test',
				published: true, nav: true
			};

			const WrittenByAdmin2Res = await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.Admin2Cookie) // Using a DIFFERENT admin user here!
				.send(content);
			expect(WrittenByAdmin2Res).to.have.status(200);

			const queryAdmin1: AggregationQuery = { createdBy: TestBed.AdminUser._id };
			const queryAdmin2: AggregationQuery = { createdBy: TestBed.AdminUser2._id };

			const [resAdmin1, resAdmin2] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAdmin1),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAdmin2),
			]);
			const allContentDocs = await ContentModel.find({}, { current: 1 });

			expect(resAdmin1).to.have.status(200);
			expect(resAdmin1).to.have.property('body');
			expect(resAdmin1.body).to.be.an('array');

			expect(resAdmin2).to.have.status(200);
			expect(resAdmin2).to.have.property('body');
			expect(resAdmin2.body).to.be.an('array');

			const allPages = allContentDocs.map(contentDoc => contentDoc.current);

			const filteredAdmin1Count = allPages.filter(c => TestBed.AdminUser._id.equals(c.createdBy)).length;
			const filteredAdmin2Count = allPages.filter(c => TestBed.AdminUser2._id.equals(c.createdBy)).length;

			const admin1Count = (<any[]>resAdmin1.body).length;
			const admin2Count = (<any[]>resAdmin2.body).length;

			expect(admin1Count).to.equal(filteredAdmin1Count, 'should have filtered based on creator (admin1)');
			expect(admin2Count).to.equal(filteredAdmin2Count, 'should have filtered based on creator (admin2)');
		});

		it('POST /api/admin/cms/aggregate 200, access only', async () => {
			const queryAll: AggregationQuery = { };
			const queryEveryone: AggregationQuery = { access: [] };
			const queryMembers: AggregationQuery = { access: [AccessRoles.member] };
			const queryAdmins: AggregationQuery = { access: [AccessRoles.admin] };

			const content: Partial<Content> = { content: 'test', description: 'test', folder: 'test', published: true, nav: true };

			const [res1, res2, res3] = await Promise.all([
				TestBed.http.post('/api/cms').set('Cookie', TestBed.AdminCookie).send(Object.assign({
					route: 'aggregAccess1', title: 'aggregAccess1', access: []
				}, content)),
				TestBed.http.post('/api/cms').set('Cookie', TestBed.AdminCookie).send(Object.assign({
					route: 'aggregAccess2', title: 'aggregAccess2', access: [AccessRoles.member]
				}, content)),
				TestBed.http.post('/api/cms').set('Cookie', TestBed.AdminCookie).send(Object.assign({
					route: 'aggregAccess3', title: 'aggregAccess3', access: [AccessRoles.admin]
				}, content))
			]);

			expect(res1).to.have.status(200);
			expect(res2).to.have.status(200);
			expect(res3).to.have.status(200);

			const [resAll, resEveryone, resMembers, resAdmins] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAll),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryEveryone),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryMembers),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAdmins),
			]);
			const allContentDocs = await ContentModel.find({}, { current: 1 });
			const allPages = allContentDocs.map(contentDoc => contentDoc.current);

			for (const res of [resAll, resEveryone, resMembers, resAdmins]) {
				expect(res).to.have.status(200);
				expect(res).to.have.property('body');
				expect(res.body).to.be.an('array');
			}

			const allCount = allPages.length;
			const everyoneCount = allPages.filter(c => c.access.length === 0).length;
			const membersCount = allPages.filter(c => c.access.includes(AccessRoles.member)).length;
			const adminsCount = allPages.filter(c => c.access.includes(AccessRoles.admin)).length;

			const queryAllCount = (<any[]>resAll.body).length;
			const queryEveryoneCount = (<any[]>resEveryone.body).length;
			const queryMembersCount = (<any[]>resMembers.body).length;
			const queryAdminsCount = (<any[]>resAdmins.body).length;

			expect(allCount).to.equal(queryAllCount, 'should have filtered based on access (all)');
			expect(everyoneCount).to.equal(queryEveryoneCount, 'should have filtered based on access (everyone)');
			expect(membersCount).to.equal(queryMembersCount, 'should have filtered based on access (members)');
			expect(adminsCount).to.equal(queryAdminsCount, 'should have filtered based on access (admins)');
		});

		it('POST /api/admin/cms/aggregate 200, published only', async () => {
			const queryPublished: AggregationQuery = { published: true };
			const queryUnpublished: AggregationQuery = { published: false };

			const content: Content = {
				title: 'unpubAggreg', route: 'unpubaggreg',
				content: 'test', access: [],
				description: 'test', folder: 'test',
				published: false, nav: true // published === false
			};

			const pushUnpublishedContentRes = await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie).send(content);

			expect(pushUnpublishedContentRes).to.have.status(200);

			const [resPublished, resUnpublished] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryPublished),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryUnpublished),
			]);
			const allContentDocs = await ContentModel.find({}, { current: 1 });

			expect(resPublished).to.have.status(200);
			expect(resPublished).to.have.property('body');
			expect(resPublished.body).to.be.an('array');

			expect(resUnpublished).to.have.status(200);
			expect(resUnpublished).to.have.property('body');
			expect(resUnpublished.body).to.be.an('array');

			const allPages = allContentDocs.map(contentDoc => contentDoc.current);

			const publishedCount = allPages.filter(c => c.published === true).length;
			const unpublishedCount = allPages.filter(c => c.published === false).length;

			const queryPublishedCount = (<any[]>resPublished.body).length;
			const queryUnpublishedCount = (<any[]>resUnpublished.body).length;

			expect(publishedCount).to.equal(queryPublishedCount, 'should have filtered based on published (true)');
			expect(unpublishedCount).to.equal(queryUnpublishedCount, 'should have filtered based on published (false)');
		});

		it('POST /api/admin/cms/aggregate 200, seen after only', async () => {
			const afterDate = new Date();

			const content: Content = {
				title: 'aggregSeenAfter', route: 'aggregseenafter', content: 'test', access: [],
				description: 'test', folder: 'test', published: true, nav: true
			};

			const contentRes = await TestBed.http.post('/api/cms/').set('Cookie', TestBed.AdminCookie).send(content);
			expect(contentRes).to.have.status(200);

			// View the page
			const viewRes = await TestBed.http.get('/api/cms/' + content.route);
			expect(viewRes).to.have.status(200);

			const afterDate2 = new Date();

			const queryAfter: AggregationQuery = { seenAfterDate: afterDate };
			const queryAfter2: AggregationQuery = { seenAfterDate: afterDate2 };

			const [resAfter, resAfter2] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAfter),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryAfter2)
			]);

			expect(resAfter).to.have.status(200);
			expect(resAfter).to.have.property('body');
			expect(resAfter.body).to.be.an('array');
			const contentFind = (<any[]>resAfter.body).find((c: any) => c.route === content.route);
			expect(contentFind).to.not.be.an('undefined'); // to NOT be.
			expect(contentFind.views).to.equal(1);

			expect(resAfter2).to.have.status(200);
			expect(resAfter2).to.have.property('body');
			expect(resAfter2.body).to.have.property('message');
			expect(resAfter2.body.message).to.equal(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND);
		});

		it('POST /api/admin/cms/aggregate 200, seen before only', async () => {
			const beforeDate = new Date();

			const content: Content = {
				title: 'aggregSeenBefore', route: 'aggregseenbefore', content: 'test', access: [],
				description: 'test', folder: 'test', published: true, nav: true
			};

			const contentRes = await TestBed.http.post('/api/cms/').set('Cookie', TestBed.AdminCookie).send(content);
			expect(contentRes).to.have.status(200);

			// View the page
			const viewRes = await TestBed.http.get('/api/cms/' + content.route);
			expect(viewRes).to.have.status(200);

			// Date2
			const beforeDate2 = new Date();

			// viewBefore2
			const viewRes2 = await TestBed.http.get('/api/cms/' + content.route);
			expect(viewRes2).to.have.status(200);

			const queryBefore: AggregationQuery = { seenBeforeDate: beforeDate };
			const queryBefore2: AggregationQuery = { seenBeforeDate: beforeDate2 };

			const [resBefore, resBefore2] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryBefore),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(queryBefore2)
			]);

			expect(resBefore).to.have.status(200);
			expect(resBefore).to.have.property('body');
			expect(resBefore.body).to.be.an('array');
			const contentFind = (<any[]>resBefore.body).find((c: any) => c.route === content.route);
			expect(contentFind).to.be.an('undefined'); // to be undefined. It wasn't seen before the date specified

			// the second before was created AFTER the new content, and should thus include the content we POSTed above
			expect(resBefore2).to.have.status(200);
			expect(resBefore2).to.have.property('body');
			expect(resBefore2.body).to.be.an('array');
			const contentFind2 = (<any[]>resBefore2.body).find((c: any) => c.route === content.route);
			if (!contentFind2) {
				console.log(resBefore2.body);
			}
			expect(contentFind2).to.not.be.an('undefined'); // to NOT be undefined.
			expect(contentFind2.views).to.equal(1); // Views count should have increased.
		});

		it('POST /api/admin/cms/aggregate 200, browser only', async () => {
			const query1: AggregationQuery = { browsers: ['Edge'] };
			const query2: AggregationQuery = { browsers: ['Chrome'] };
			const query3: AggregationQuery = { browsers: ['Edge', 'Chrome'] };

			const content: Content = {
				title: 'browserAggreg', route: 'browseraggreg',
				content: 'test', access: [],
				description: 'test', folder: 'test',
				published: true, nav: true
			};
			const pageToViewRes = await TestBed.http.post('/api/cms').set('Cookie', TestBed.AdminCookie).send(content);
			expect(pageToViewRes).to.have.status(200);

			/* tslint:disable:max-line-length */
			const viewRes = await TestBed.http.get('/api/cms/' + content.route)
				.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36');
			/* tslint:enable:max-line-length */
			expect(viewRes).to.have.status(200);

			// at this point we expect to have one view on our page

			const [resEdge, resChrome, resBoth] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query1),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query2),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query3),
			]);

			expect(resEdge).to.have.status(200);
			expect(resEdge).to.have.property('body');
			expect(resEdge.body).to.have.property('message');
			expect(resEdge.body.message).to.equal(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND);

			const resChromeContent = (<Content[]>resChrome.body).find(c => c.route === content.route);
			const resBothContent = (<Content[]>resBoth.body).find(c => c.route === content.route);

			expect(resChrome).to.have.status(200);
			expect(resChrome).to.have.property('body');
			expect(resChrome.body).to.be.an('array');
			expect(resChrome.body[0]).to.have.property('views');
			expect(resChromeContent.views).to.be.equal(1);

			expect(resBoth).to.have.status(200);
			expect(resBoth).to.have.property('body');
			expect(resBoth.body).to.be.an('array');
			expect(resBothContent.views).to.be.equal(1);
		});

		it('POST /api/admin/cms/aggregate 200, unwind only', async () => {
			const query: AggregationQuery = { unwind: true };

			const content: Content = {
				title: 'unwindAggreg', route: 'unwindaggreg',
				content: 'test', access: [],
				description: 'test', folder: 'test',
				published: true, nav: true
			};
			const pageToViewRes = await TestBed.http.post('/api/cms').set('Cookie', TestBed.AdminCookie).send(content);
			expect(pageToViewRes).to.have.status(200);

			/* tslint:disable:max-line-length */
			const viewRes = await TestBed.http.get('/api/cms/' + content.route)
				.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36');
			/* tslint:enable:max-line-length */
			expect(viewRes).to.have.status(200);

			const res = await TestBed.http.post('/api/admin/cms/aggregate')
				.set('Cookie', TestBed.AdminCookie)
				.send(query);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');

			// Expect all properties we expect to find
			const resContent = (<any[]>res.body).find(c => c.route === content.route);
			expect(resContent).to.have.property('title');
			expect(resContent).to.have.property('route');
			expect(resContent).to.have.property('logDataTs');
			expect(resContent).to.have.property('logDataBrowser');

			expect(resContent.title).to.be.equal(content.title);
			expect(resContent.route).to.be.equal(content.route);
			expect(new Date(resContent.logDataTs).valueOf()).to.be.greaterThan(0);
			expect(resContent.logDataBrowser).to.be.equal('Chrome');
		});

		it('POST /api/admin/cms/aggregate 200, properties', async () => {
			const query: AggregationQuery = {};

			const content: Content = {
				title: 'propAggreg', route: 'propaggreg',
				content: 'test', access: [],
				description: 'test', folder: 'test',
				published: true, nav: true
			};
			const pageToViewRes = await TestBed.http.post('/api/cms').set('Cookie', TestBed.AdminCookie).send(content);
			expect(pageToViewRes).to.have.status(200);

			/* tslint:disable:max-line-length */
			const viewRes = await TestBed.http.get('/api/cms/' + content.route)
				.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36');
			/* tslint:enable:max-line-length */
			expect(viewRes).to.have.status(200);

			const res = await TestBed.http.post('/api/admin/cms/aggregate')
				.set('Cookie', TestBed.AdminCookie)
				.send(query);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');

			// Expect all properties we expect to find
			const resContent = (<any[]>res.body).find(c => c.route === content.route);
			expect(resContent).to.have.property('title');
			expect(resContent).to.have.property('route');
			expect(resContent).to.have.property('views');
			expect(resContent).to.have.property('lastVisit');

			expect(resContent.title).to.be.equal(content.title);
			expect(resContent.route).to.be.equal(content.route);
			expect(resContent.views).to.be.equal(1);
		});

		it('POST /api/admin/cms/aggregate 401', async () => {
			const query: AggregationQuery = {};

			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.post('/api/admin/cms/aggregate').send(query),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.MemberCookie).send(query),
				TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200); // this should be allowed.
		});

		it('POST /api/admin/cms/aggregate 422', async () => {
			const query = { someOtherProperty: 'test' };

			const res = await TestBed.http.post('/api/admin/cms/aggregate').set('Cookie', TestBed.AdminCookie).send(query);
			expect(res).to.have.status(422);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(VALIDATION_FAILED.ADMIN_MODEL);
			expect(res.body).to.have.property('errors');
			expect(res.body.errors).to.be.an('array');
			expect(res.body.errors[0]).to.have.property('error');
			expect(res.body.errors[0]).to.have.property('params');
			expect(res.body.errors[0].params).to.have.property('additionalProperty');
			expect(res.body.errors[0].params.additionalProperty).to.equal('someOtherProperty');
		});
	});

});
