export interface User {
	_id: any;
	username: string;
	username_lower?: string;
	role?: AccessRoles.user | AccessRoles.admin;
	password?: string;
	createdAt?: Date;
	exp?: number;
	comparePassword?: (candidatePassword: string) => Promise<boolean>;
	isOfRole?: (role: AccessRoles) => boolean;
	canAccess?: (level: AccessRoles) => boolean;
}

export interface UpdatePasswordUser {
	password: string;
	newPassword: string;
	confirm: string;
}

export interface UserToken {
	token: string;
	user?: User;
}

export enum AccessRoles {
	admin = 'admin',
	user = 'user',
	everyone = 'everyone'
}
