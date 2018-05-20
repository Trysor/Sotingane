// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

const apiURL = 'http://localhost:2000/api';

export const environment = {
	production: false,

	TIMEOUT: 5000,

	URL: {
		api:				apiURL,
		auth: {
			login:			apiURL + '/auth/login',
			token:			apiURL + '/auth/token',
			updatepass:		apiURL + '/auth/updatepassword',
		},
		steam: {
			servers:		apiURL + '/steam',
		},
		cms: {
			content:		apiURL + '/cms',
			history:		apiURL + '/cms/history',
			search:			apiURL + '/cms/search',
		},
		admin: {
			users:			apiURL + '/admin/users',
			cms:			apiURL + '/admin/cms',
		}
	},

	META: {
		title: 'Sotingane',
		desc: 'The home of Sotingane',
	},

	FOOTER: {
		desc: 'Sotingane',
		copyright: 'Copyright © 2018 <name | business>. All rights reserved.'
	}
};

