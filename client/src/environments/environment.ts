import { API } from './api';

export const env = {
	production: false,

	TIMEOUT: 5000,

	API: API,
	API_BASE: 'http://localhost:2000',

	META: {
		title: '<Page title>',
		desc: '<Page desc>',
	},

	ORG: '<business>',

	FOOTER: {
		desc: '<footer text>',
		copyright: 'Copyright © 2018 <name | business>. All rights reserved.'
	}
};

