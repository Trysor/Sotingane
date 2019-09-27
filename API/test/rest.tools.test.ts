import { expect } from 'chai';

import { Content, AccessRoles } from '../types';
import { CMS_STATUS, VALIDATION_FAILED } from '../src/libs/validate';

import { TestBed } from './testbed';


// ---------------------------------
// -------- Tools TestSuite --------
// ---------------------------------


describe('REST: Tools', () => {



	// ---------------------------------
	// --- /api/tools/history/:route ---
	// ---------------------------------

	describe('/api/tools/history/:route', () => {
		it('GET /api/tools/history/:route 200', async () => {
			const content: Content = {
				title: 'history',
				route: 'history',
				content: 'test',
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			const patched: Content = {
				title: 'history',
				route: 'history',
				content: 'new patched content',
				access: [],
				description: 'test',
				folder: 'test',
				published: true,
				nav: true
			};

			await TestBed.http.post('/api/cms/')
				.set('Cookie', TestBed.AdminCookie) // admin creates
				.send(content);


			await TestBed.http.patch('/api/cms/' + content.route)
				.set('Cookie', TestBed.AdminCookie) // admin patches
				.send(patched);

			const getRes = await TestBed.http.get('/api/tools/history/' + content.route).set('Cookie', TestBed.AdminCookie); // get as admin

			expect(getRes).to.have.status(200);
			expect(getRes).to.have.property('body');
			expect(getRes.body).to.be.an('array');
			expect(getRes.body[0]).to.have.property('route');
			expect(getRes.body[0]).property('route').to.equal(content.route);
			expect(getRes.body[0]).to.have.property('content');
			expect(getRes.body[0]).property('content').to.equal(content.content); // content = original. NOT equal to the patched version
		});

		it('GET /api/tools/history/:route 401', async () => {
			const route = 'history';
			const [noAuthRes, userRes] = await Promise.all([
				TestBed.http.get('/api/tools/history/' + route),
				TestBed.http.get('/api/tools/history/' + route).set('Cookie', TestBed.MemberCookie)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
		});

	});


	// ---------------------------------
	// - /api/tools/search/:searchTerm -
	// ---------------------------------


	describe('/api/tools/search/:searchTerm', () => {
		it('GET /api/tools/search/:searchTerm 200', async () => {
			const list = [];

			for (let i = 0; i < 5; i++) {
				list.push(TestBed.http.post('/api/cms/').set('Cookie', TestBed.AdminCookie).send({
					title: 'search' + i,
					route: 'search' + i,
					content: 'search',
					access: [], // FOR EVERYONE
					description: 'search',
					folder: 'test',
					published: true,
					nav: true
				}));

				list.push(TestBed.http.post('/api/cms/').set('Cookie', TestBed.AdminCookie).send({
					title: 'searchUser' + i,
					route: 'searchUser' + i,
					content: 'search',
					access: [AccessRoles.member], // MEMBER RIGHTS REQUIRED
					description: 'search',
					folder: 'test',
					published: true,
					nav: true
				}));

				list.push(TestBed.http.post('/api/cms/').set('Cookie', TestBed.AdminCookie).send({
					title: 'searchAdmin' + i,
					route: 'searchAdmin' + i,
					content: 'search',
					access: [AccessRoles.admin], // ADMIN RIGHTS REQUIRED
					description: 'search',
					folder: 'test',
					published: true,
					nav: true
				}));
			}


			const postResponses = await Promise.all(list);

			const searchTerm = 'search';

			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.get('/api/tools/search/' + searchTerm),
				TestBed.http.get('/api/tools/search/' + searchTerm).set('Cookie', TestBed.MemberCookie),
				TestBed.http.get('/api/tools/search/' + searchTerm).set('Cookie', TestBed.AdminCookie)
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

			expect(userRes).to.have.status(200);
			expect(userRes.body).to.be.of.length(10);

			expect(adminRes).to.have.status(200);
			expect(adminRes.body).to.be.of.length(15);
		});


		it('GET /api/tools/search/:searchTerm 200, empty', async () => {
			const searchTerm = 'does not exist';
			const res = await TestBed.http.get('/api/tools/search/' + searchTerm);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.have.property('message');
			expect(res.body.message).to.equal(CMS_STATUS.SEARCH_RESULT_NONE_FOUND);
		});

	});
});
