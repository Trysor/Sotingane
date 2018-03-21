import { expect } from 'chai';

import { ContentModel, Content } from '../src/models/content';
import { status, ROUTE_STATUS, CMS_STATUS, VALIDATION_FAILED } from '../src/libs/validate';

import { TestBed, AdminUser } from './testbed';


// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------


describe('REST: Admin', () => {

	// ---------------------------------
	// ---------- /api/admin/ ----------
	// ---------------------------------


	describe('/api/admin/users/', () => {
		it('GET /api/admin/users/ 200');



	});


	describe('/api/admin/users/:id', () => {
		it('PATCH /api/admin/users/:id 200');

		it('PATCH /api/admin/users/:id 422');

		it('PATCH /api/admin/users/:id 401');

	});

});
