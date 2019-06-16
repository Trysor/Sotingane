
export interface JWTUser {
	_id: any;
	username: string;
	roles?: AccessRoles[];
	exp?: number;
}
export interface User extends JWTUser {
	username_lower?: string;
	password?: string;
	createdAt?: Date;
	comparePassword?: (candidatePassword: string) => Promise<boolean>;
	canAccess?: (level: AccessRoles) => boolean;
}

export interface UpdatePasswordUser {
	password: string;
	newPassword: string;
	confirm: string;
}

export interface TokenResponse {
	token?: string;
	refreshToken?: string | null;
	user: JWTUser;
}

export enum AccessRoles {
	admin = 'admin',
	member = 'member',
	writer = 'writer',
}
