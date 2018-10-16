import { expect } from 'chai';

import { Theme } from '../src/models';
import { VALIDATION_FAILED, THEME_STATUS } from '../src/libs/validate';

import { TestBed } from './testbed';

// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------

const themeName = 'Test';
const emptyTheme: Theme = {
	name: themeName,
	vars: {
		'--app-prim-1': '#000',
		'--app-prim-2': '#000',
		'--app-prim-3': '#000',
		'--app-prim-c-1': '#000',
		'--app-prim-c-2': '#000',
		'--app-prim-c-3': '#000',

		'--app-acc-1': '#000',
		'--app-acc-2': '#000',
		'--app-acc-3': '#000',
		'--app-acc-c-1': '#000',
		'--app-acc-c-2': '#000',
		'--app-acc-c-3': '#000',

		'--color-text': '#000',
		'--color-background': '#000',
		'--color-header': '#000',
		'--color-sidepanel': '#000',
		'--color-material': '#000',
		'--color-content': '#000',
		'--color-shade': '#000',
		'--color-active': '#000',
		'--color-overlay': '#000',
		'--color-border': '#000',
		'--color-disabled': '#000',

		'--border': '#000',
		'--shadow': '#000',

		'--width-wrapper': '#000',
		'--width-side': '#000',
		'--width-max-field': '#000',
		'--height-header': '#000',
	}
};

describe('REST: Theme', () => {

	// ---------------------------------
	// ------- /api/settings --------
	// ---------------------------------


	describe('/api/theme/', () => {
		it('POST /api/theme/ 200', async () => {
			const res = await TestBed.http.post('/api/theme')
				.set('Cookie', TestBed.AdminCookie)
				.send(emptyTheme);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(THEME_STATUS.THEME_UPDATED);
		});


		it('POST /api/theme/ 401', async () => {
			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.post('/api/theme').send(emptyTheme),
				TestBed.http.post('/api/theme').send(emptyTheme).set('Cookie', TestBed.UserCookie),
				TestBed.http.post('/api/theme').send(emptyTheme).set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200); // this should be allowed.
		});


		it('POST /api/theme/ 422, empty', async () => {
			const res = await TestBed.http.post('/api/theme').set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(422);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(VALIDATION_FAILED.THEME_MODEL);
		});

		it('POST /api/theme/ 422, missing properties', async () => {
			const missingProp = JSON.parse(JSON.stringify(emptyTheme));
			delete missingProp.vars['--app-acc-1'];

			const res = await TestBed.http.post('/api/theme').send(missingProp).set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(422);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(VALIDATION_FAILED.THEME_MODEL);
		});


		it('PATCH /api/theme/ 200', async () => {
			const res = await TestBed.http.patch('/api/theme/' + themeName)
				.set('Cookie', TestBed.AdminCookie)
				.send(emptyTheme);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(THEME_STATUS.THEME_UPDATED);
		});


		it('PATCH /api/theme/ 401', async () => {
			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.patch('/api/theme/' + themeName).send(emptyTheme),
				TestBed.http.patch('/api/theme/' + themeName).send(emptyTheme).set('Cookie', TestBed.UserCookie),
				TestBed.http.patch('/api/theme/' + themeName).send(emptyTheme).set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200); // this should be allowed.
		});


		it('PATCH /api/theme/ 422, empty', async () => {
			const res = await TestBed.http.patch('/api/theme/' + themeName).set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(422);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(VALIDATION_FAILED.THEME_MODEL);
		});

		it('PATCH /api/theme/ 422, missing properties', async () => {

			const missingProp = JSON.parse(JSON.stringify(emptyTheme));
			delete missingProp.vars['--app-acc-1'];

			const res = await TestBed.http.patch('/api/theme/' + themeName).send(missingProp).set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(422);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(VALIDATION_FAILED.THEME_MODEL);
		});


		it('GET /api/theme/ 200', async () => {
			const res = await TestBed.http.get('/api/theme');

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('--app-prim-1');
			expect(res.body).have.property('--app-prim-2');
			expect(res.body).have.property('--app-prim-3');
			expect(res.body).have.property('--color-text');
			expect(res.body).have.property('--width-wrapper');
		});
	});
});
