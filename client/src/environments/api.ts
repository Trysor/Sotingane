
export const API = {
	api: '/api',
	auth: {
		login: '/api/auth/login',
		logout: '/api/auth/logout',
		token: '/api/auth/token',
		updatepass: '/api/auth/updatepassword',
	},
	cms: {
		content: '/api/cms',
		history: '/api/cms/history',
		search: '/api/cms/search',
	},
	admin: {
		users: '/api/admin/users',
		cms: '/api/admin/cms',
		aggregate: '/api/admin/cms/aggregate'
	},
	settings: '/api/settings',
	theme: '/api/theme'
};
