import { AccessRoles, User } from '@app/models/user';

export interface AggregationQuery {
	createdBy?: string;
	access?: AccessRoles;
	published?: boolean;
	route?: string;
	folder?: string;
	createdAfterDate?: Date;
	createdBeforeDate?: Date;
	seenAfterDate?: Date;
	seenBeforeDate?: Date;
	readBy?: string[];
	browsers?: string[];
	unwind?: boolean;
}

interface AggregationResultGeneric {
	title: string;
	route: string;
	access: AccessRoles;
	folder: string;
	description: string;
	images: string[];
	updatedAt: Date;
	createdAt: Date;
	updatedBy: User;
	createdBy: User;
}

export interface AggregationResultSummarized extends AggregationResultGeneric {
	views?: number;
	lastVisit: Date;
}

export interface AggregationResultUnwinded extends AggregationResultGeneric {
	logDataUser?: string; // id
	logDataTs?: Date;
	logDataBrowser?: string;
	logDataBrowserVer?: string;
}


export type AggregationResult = AggregationResultSummarized | AggregationResultUnwinded;



