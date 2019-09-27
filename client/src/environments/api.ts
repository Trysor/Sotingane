
export const API = {
	api: '/api',
	auth: {
		login: '/api/auth/login',
		logout: '/api/auth/logout',
		token: '/api/auth/token',
		updatepass: '/api/auth/updatepassword',
	},
	cms: '/api/cms',
	tools: {
		history: '/api/tools/history',
		search: '/api/tools/search',
	},
	files: '/api/files/',
	admin: {
		users: '/api/admin/users',
		cms: '/api/admin/cms',
		aggregate: '/api/admin/cms/aggregate'
	},
	settings: '/api/settings',
	theme: '/api/theme'
};
