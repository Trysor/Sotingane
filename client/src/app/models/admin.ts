﻿import { AccessRoles, User } from '@app/models/user';

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
	browser?: string;
	unwind?: boolean;
}

export interface AggregationResult {
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

	views?: number;

	logDataUser?: string; // id
	logDataTs?: Date;
	logDataReferer?: string;
	logDataBrowser?: string;
	logDataBrowserVer?: string;
}

