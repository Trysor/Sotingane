
export const BCRYPT_SALT_FACTOR = 12;

export const JWT = {
	EXPIRES_AUTH: 120, // in seconds (2 mins)
	EXPIRES_REFRESH: 1209600, // in seconds (14 days)
	COOKIE_AUTH: 'jwt',
	COOKIE_REFRESH: 'jwtRefresh',
	THRESHOLD_EXPIRY: 0.1
}

export const CONTENT_MAX_LENGTH = {
	TITLE: 25,
	ROUTE: 25,
	FOLDER: 25,
	DESC: 300
}

