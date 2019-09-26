import { expect } from 'chai';

import { FILE_STATUS } from '../src/libs/validate';
import { Filestore } from '../src/libs/filestore';

import { TestBed } from './testbed';
import { FileThumbnail } from '../types';

import { FileModel } from '../src/models/file.model';
import { FileData } from '../types';

// ---------------------------------
// -------- Files TestSuite --------
// ---------------------------------

let validImageUploadResult: any;

describe('REST: Files', () => {

	// ---------------------------------
	// ---- /api/files/ -----
	// ---------------------------------

	describe('/api/files/', () => {
		it('POST /api/files/ 200', async () => {
			const res = await TestBed.http.post('/api/files/')
				.set('Cookie', TestBed.WriterCookie)
				.attach('file', './test/test.png', 'test.png');

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).not.have.property('error');
			expect(res.body).have.property('default');

			validImageUploadResult = res.body;
		});

		it('POST /api/files/ 400 - Bad file', async () => {
			const res = await TestBed.http.post('/api/files/')
				.set('Cookie', TestBed.WriterCookie);
			// No file

			expect(res).to.have.status(400);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('error');
			expect(res.body.error).have.equal(FILE_STATUS.ERROR_BAD_FILE);
		});

		it('POST /api/files/ 401', async () => {
			const res = await TestBed.http.post('/api/files/')
				.attach('file', './test/test.png', 'test.png');

			expect(res).to.have.status(401);
		});

		it('GET /api/files/ 200', async () => {
			const res = await TestBed.http.get('/api/files/')
				.set('Cookie', TestBed.WriterCookie);

			expect(res).to.have.status(200);
			expect(res.body).to.be.instanceOf(Array);

			const fileThumbnail = res.body[0] as FileThumbnail;

			expect(fileThumbnail.thumbnail).to.equal(validImageUploadResult[Filestore.IMAGE_SIZES[0]]);
		});

		it('GET /api/files/ 401', async () => {

			const [res1, res2] = await Promise.all([
				TestBed.http.get('/api/files/'),
				TestBed.http.get('/api/files/').set('Cookie', TestBed.MemberCookie)
			]);

			expect(res1).to.have.status(401);
			expect(res2).to.have.status(401);
		});

		it('PATCH /api/files/ 200', async () => {
			const file: FileData = await FileModel.findOne({}).lean();
			expect(file.title).to.equal('test');

			const newTitle = 'patched title';

			const res = await TestBed.http.patch('/api/files/' + file.uuid)
				.set('Cookie', TestBed.WriterCookie)
				.send({ title: newTitle });

			const body = res.body as FileData;
			expect(res).to.have.status(200);
			expect(body.title).to.equal(newTitle);
		});
	});

	// ---------------------------------
	// - /api/files/download/:filename -
	// ---------------------------------

	describe('/api/files/download/:fileURL', () => {
		it('GET /api/files/download/:fileURL 200', async () => {
			const groups = validImageUploadResult.default.split('/');
			const fileURL = groups[groups.length - 1];

			const res = await TestBed.http.get('/api/files/download/' + fileURL);
			expect(res).to.have.status(200);
			expect(res.body).to.be.instanceOf(Buffer);
		});
	});
});
