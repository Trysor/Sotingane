import { AccessRoles } from '@app/models/user';

export interface CmsContent {
	// Always present
	title: string;
	access: AccessRoles;
	route: string;
	version: number;
	// May be present
	folder?: string;
	content?: string;
	nav?: boolean;
	description?: string;
	image?: string;
	createdBy?: string;
	updatedBy?: string;
	createdAt?: Date;
	updatedAt?: Date;
	views?: number;
	relevance?: number;
}

export interface CmsAccess {
	verbose: string;
	icon: string;
	value: string;
}

export interface CmsFolder {
	title: string;
	content: CmsContent[];
}


export interface DynamicComponent {
	buildJob(el: Element, textContent?: string): void;
}
