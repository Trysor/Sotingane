import { expect } from 'chai';

import { FILE_STATUS } from '../src/libs/validate';
import { Filestore } from '../src/libs/filestore';

import { TestBed } from './testbed';

// ---------------------------------
// -------- Files TestSuite --------
// ---------------------------------

let validImageUploadResult: any;

describe('REST: Files', () => {

	// ---------------------------------
	// ---- /api/files/uploadimage -----
	// ---------------------------------

	describe('/api/files/uploadimage', () => {
		it('POST /api/files/uploadimage 200', async () => {
			const res = await TestBed.http.post('/api/files/uploadimage')
				.set('Cookie', TestBed.AdminCookie)
				.attach('file', './test/test.png', 'test.png');

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).not.have.property('error');
			expect(res.body).have.property('default');

			validImageUploadResult = res.body;
		});

		it('POST /api/files/uploadimage 400 - Bad file', async () => {
			const res = await TestBed.http.post('/api/files/uploadimage')
				.set('Cookie', TestBed.AdminCookie);
				// No file

			expect(res).to.have.status(400);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('error');
			expect(res.body.error).have.equal(FILE_STATUS.ERROR_BAD_FILE);
		});

		it('POST /api/files/uploadimage 401', async () => {
			const res = await TestBed.http.post('/api/files/uploadimage')
				.attach('file', './test/test.png', 'test.png');

			expect(res).to.have.status(401);
		});
	});

	// ---------------------------------
	// ------ /api/files/:filename -----
	// ---------------------------------

	describe('/api/files/:filename', () => {
		it('GET /api/files/:filename 200', async () => {
			const groups = validImageUploadResult.default.split('/');
			const filename = groups[groups.length - 1];

			const res = await TestBed.http.get('/api/files/' + filename);
			expect(res).to.have.status(200);
			expect(res.body).to.be.instanceOf(Buffer);
		});
	});


	// ---------------------------------
	// ---------- /api/files/ ----------
	// ---------------------------------

	describe('/api/files/', () => {
		it('GET /api/files/ 200', async () => {
			const res = await TestBed.http.get('/api/files/')
				.set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(200);
			expect(res.body).to.be.instanceOf(Array);

			const imageURL = res.body[0];

			expect(imageURL).to.equal(validImageUploadResult[Filestore.IMAGE_SIZES[0]]);
		});

		it('GET /api/files/ 401', async () => {
			const res = await TestBed.http.get('/api/files/');
			expect(res).to.have.status(401);
		});
	});
});
