import { expect } from 'chai';

import { Settings } from '../src/models';
import { VALIDATION_FAILED, SETTINGS_STATUS } from '../src/libs/validate';

import { TestBed } from './testbed';

// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------

const emptySettings: Settings = {
	'theme': {
		'--app-prim-1': '',
		'--app-prim-2': '',
		'--app-prim-3': '',
		'--app-prim-c-1': '',
		'--app-prim-c-2': '',
		'--app-prim-c-3': '',

		'--app-acc-1': '',
		'--app-acc-2': '',
		'--app-acc-3': '',
		'--app-acc-c-1': '',
		'--app-acc-c-2': '',
		'--app-acc-c-3': '',

		'--color-text': '',
		'--color-background': '',
		'--color-header': '',
		'--color-sidepanel': '',
		'--color-material': '',
		'--color-content': '',
		'--color-shade': '',
		'--color-active': '',
		'--color-overlay': '',
		'--color-border': '',
		'--color-disabled': '',

		'--border': '',
		'--shadow': '',

		'--width-wrapper': '',
		'--width-side': '',
		'--width-max-field': '',
		'--height-header': ''
	},
	'org': '',
	'meta': {
		'title': '',
		'desc': ''
	},
	'footer': {
		'text': '',
		'copyright': ''
	}
};

describe('REST: Settings', () => {

	// ---------------------------------
	// ------- /api/settings --------
	// ---------------------------------


	describe('/api/settings/', () => {
		it('POST /api/settings/ 200', async () => {
			const res = await TestBed.http.post('/api/settings')
				.set('Cookie', TestBed.AdminCookie)
				.send(emptySettings);

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(SETTINGS_STATUS.SETTINGS_UPDATED);
		});


		it('POST /api/settings/ 401', async () => {
			const [noAuthRes, userRes, adminRes] = await Promise.all([
				TestBed.http.post('/api/settings').send(emptySettings),
				TestBed.http.post('/api/settings').send(emptySettings).set('Cookie', TestBed.UserCookie),
				TestBed.http.post('/api/settings').send(emptySettings).set('Cookie', TestBed.AdminCookie)
			]);

			expect(noAuthRes).to.have.status(401);
			expect(userRes).to.have.status(401);
			expect(adminRes).to.have.status(200); // this should be allowed.
		});


		it('POST /api/settings/ 422', async () => {
			const res = await TestBed.http.post('/api/settings').set('Cookie', TestBed.AdminCookie);

			expect(res).to.have.status(422);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('message');
			expect(res.body).property('message').to.equal(VALIDATION_FAILED.SETTING_MODEL);
		});




		it('GET /api/settings/ 200', async () => {
			const res = await TestBed.http.get('/api/settings');

			expect(res).to.have.status(200);
			expect(res).to.have.property('body');
			expect(res.body).to.be.an('object');
			expect(res.body).have.property('theme');
			expect(res.body).have.property('org');
			expect(res.body).have.property('meta');
			expect(res.body).have.property('footer');
		});
	});
});
