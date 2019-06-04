import { expect } from 'chai';

import { TestBed } from './testbed';

// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------


describe('Express: Content Type', () => {

	it('Content Type: JSON', async () => {
		const res = await TestBed.http.get('/api/cms/'); // access everyone
		// tslint:disable-next-line: no-unused-expression
		expect(res).to.be.json;
	});

});
