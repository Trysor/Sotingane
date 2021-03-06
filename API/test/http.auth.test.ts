﻿import { expect } from 'chai';

import { Content, AccessRoles } from '../types';

import { TestBed } from './testbed';

// ---------------------------------
// ------- Content TestSuite -------
// ---------------------------------


describe('HTTP: Authorization', () => {

	it('HTTP auth cookie', async () => {
		const content: Content = {
			title: 'httpAuthCookie',
			route: 'httpAuthCookie',
			content: 'test',
			access: [],
			description: 'test',
			folder: 'test',
			published: true,
			nav: true,
			tags: []
		};

		const res = await TestBed.http.post('/api/cms/')
			.set('Cookie', TestBed.AdminCookie)
			.send(content);

		expect(res).to.have.status(200);

	});

	it('HTTP auth header', async () => {
		const content: Content = {
			title: 'httpAuthHeader',
			route: 'httpAuthHeader',
			content: 'test',
			access: [],
			description: 'test',
			folder: 'test',
			published: true,
			nav: true,
			tags: []
		};

		const extractedJwt = TestBed.AdminCookie.split('=')[1];

		const res = await TestBed.http.post('/api/cms/')
			.set('Authorization', extractedJwt)
			.send(content);

		expect(res).to.have.status(200);
	});
});
