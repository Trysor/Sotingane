
import { AccessRoles } from './user';



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
	access?: AccessRoles[];
	route: string;
	published?: boolean;
	version?: number;

	views?: number;

	content?: string;
	content_searchable?: string;

	description?: string;
	images?: ImageContentData[];

	folder?: string;
	nav?: boolean;

	updatedBy?: AuthorObject;
	createdBy?: AuthorObject;

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


export interface ImageContentData {
	width: number;
	height: number;
	type: string;
	url: string;
}


export interface AuthorObject {
	username: string;
	_id?: string;
}
