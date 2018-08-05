import { AccessRoles } from '@app/models/user';

interface UserObject {
	username: string;
}

export interface CmsContent {
	// Always present
	title: string;
	access: AccessRoles;
	route: string;
	// May be present
	published?: boolean;
	version?: number;
	folder?: string;
	content?: string;
	nav?: boolean;
	description?: string;
	images?: string[];
	createdBy?: UserObject;
	updatedBy?: UserObject;
	createdAt?: Date;
	updatedAt?: Date;
	views?: number;
	relevance?: number;
}

export interface CmsAccess {
	single: string;
	plural: string;
	icon: string;
	value: AccessRoles;
}

export interface CmsFolder {
	title: string;
	content: CmsContent[];
}


export interface DynamicComponent {
	buildJob(el: Element, textContent?: string): void;
}
