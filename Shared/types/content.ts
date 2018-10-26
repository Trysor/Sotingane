
import { AccessRoles } from './user';


interface UserObject {
	username: string;
}


export interface ContentEntry {
	current: Content;
	prev: Content[];

	views: number;

	updatedAt?: Date;
	createdAt?: Date;
	_id: any;
}


export interface Content {
	title: string;
	access?: AccessRoles;
	route: string;
	published?: boolean;
	version?: number;

	views?: number;

	content?: string;
	content_searchable?: string;

	description?: string;
	images?: string[]; // url

	folder?: string;
	nav?: boolean;

	updatedBy?: UserObject;
	createdBy?: UserObject;

	updatedAt?: Date;
	createdAt?: Date;
}

export interface SearchResultContent extends Content {
	relevance: number;
}




export interface CmsAccess {
	single: string;
	plural: string;
	icon: string;
	value: AccessRoles;
}

export interface CmsFolder {
	title: string;
	content: Content[];
}

