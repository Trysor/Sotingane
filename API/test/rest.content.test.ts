import { expect } from 'chai';

import { ContentModel, Content } from '../src/models/content';
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

			const content = {
				title: 'test',
				route: 'test',
				content: 'test',
				access: 'everyone',
				description: 'test',
				folder: 'test',
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

			const content = {
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
				access: 'everyone',
				description: 'test',
				folder: 'test',
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

			const properContent = {
				title: 'test3',
				route: 'test3',
				content: 'test',
				access: 'everyone',
				description: 'test',
				folder: 'test',
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


			const [badRouteRes, badTitleRes, badContentRes, badDescRes] = await Promise.all([
				TestBed.http.post('/api/cms').send(badRoute).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/cms').send(badTitle).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/cms').send(badContent).set('Authorization', TestBed.AdminToken),
				TestBed.http.post('/api/cms').send(badDesc).set('Authorization', TestBed.AdminToken)
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
		});

		it('GET /api/cms/ 200', async () => {
			const res = await TestBed.http.get('/api/cms/');

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('array');
			expect(res.body[0]).to.have.property('title');
			expect(res.body[0]).to.have.property('route');
		});

		it('GET /api/cms/ 200, member');

		// TODO: Implement member filtering

		it('GET /api/cms/ 200, admin');

		// TODO: Implement admin filtering

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

		it('PATCH /api/cms/:route 200');

		it('PATCH /api/cms/:route 422');

		it('PATCH /api/cms/:route 401');


		it('DELETE /api/cms/:route 200');

		it('DELETE /api/cms/:route 401');
	});


	// ---------------------------------
	// ---- /api/cms/history/:route ----
	// ---------------------------------

	describe('/api/cms/history/:route', () => {
		it('GET /api/cms/history/:route 200');
	});


	// ---------------------------------
	// -- /api/cms/search/:searchTerm --
	// ---------------------------------


	describe('/api/cms/search/:searchTerm', () => {
		it('GET /api/cms/search/:searchTerm 200');
	});

});
