import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { ajv, JSchema, ADMIN_STATUS } from '../libs/validate';
import * as mongoose from 'mongoose';
import { UAParser } from 'ua-parser-js';

import { User, accessRoles } from '../models/user';
import { Log, LogModel } from '../models/log';
import { ContentModel, Content, ContentDoc } from '../models/content';

import { status, ROUTE_STATUS, CMS_STATUS } from '../libs/validate';

export class AdminController {
	/**
	 * Gets all content
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: a list of partial content information
	 */
	public static async getAdminContentList(req: Req, res: Res, next: Next) {
		const contentList: Content[] = await ContentModel.aggregate([
			{ $lookup: { from: 'logs', localField: '_id', 'foreignField': 'content', as: 'views' } },
			{
				$project: {
					current: {
						title: 1, route: 1, published: 1, access: 1, updatedAt: 1, createdAt: 1,
						folder: 1, description: 1, nav: 1, views: { $size: '$views' }
					}
				}
			},
			{ $replaceRoot: { newRoot: '$current' } },
		]);

		if (!contentList) {
			return res.status(404).send(status(CMS_STATUS.NO_ROUTES));
		}
		res.status(200).send(contentList);
	}


	/**
	 * Gets all content of a given route, declared by the param
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the content object
	 */
	public static async getContentFull(req: Req, res: Res, next: Next) {
		const route: string = req.params.route;

		const contentDoc = <ContentDoc>await ContentModel.findOne(
			{ 'current.route': route },
			{ 'current': 1 }
		).populate([
			{ path: 'current.updatedBy', select: 'username -_id' }, // exclude _id
			{ path: 'current.createdBy', select: 'username -_id' }  // exclude _id
		]);

		if (!contentDoc) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }
		res.status(200).send(contentDoc.current);
	}




	/**
	 * Aggregates Content and Log data
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the aggregated data
	 */
	public static async aggregateContent(req: Req, res: Res, next: Next) {
		const query: AggregationQuery = req.body;

		const match: any = {};
		if (query.createdBy) { match['current.createdBy'] = mongoose.Types.ObjectId(query.createdBy); }		// CreatedBy
		if (query.access) { match['current.access'] = query.access; }										// Access
		if (query.hasOwnProperty('published')) { match['current.published'] = query.published; }			// Published
		if (query.route) { match['current.route'] = query.route; }											// Route
		if (query.folder) { match['current.folder'] = query.folder; }										// Folder

		// Content Date handling
		if (!!query.createdAfterDate && !!query.createdBeforeDate) {
			match['current.createdAt'] = { '$gte': new Date(query.createdAfterDate), '$lt': new Date(query.createdBeforeDate) };
		} else if (query.createdAfterDate) {
			match['current.createdAt'] = { '$gte': new Date(query.createdAfterDate) };
		} else if (query.createdBeforeDate) {
			match['current.createdAt'] = { '$lt': new Date(query.createdBeforeDate) };
		}

		// User views Date handling
		const userFilter: any[] = [];
		if (!!query.seenAfterDate && !!query.seenBeforeDate) {
			userFilter.push({ '$gte': ['$ts', new Date(query.seenAfterDate)] });
			userFilter.push({ '$lt': ['$ts', new Date(query.seenBeforeDate)] });
		} else if (!!query.seenAfterDate) {
			userFilter.push({ '$gte': ['$ts', new Date(query.seenAfterDate)] });
		} else if (!!query.seenBeforeDate) {
			userFilter.push({ '$lt': ['$ts', new Date(query.seenBeforeDate)] });
		}
		if (!!query.readBy && query.readBy.length > 0) { // Read by check (must compare against ObjectId)
			userFilter.push({ $in: ['$user', query.readBy.map(id => mongoose.Types.ObjectId(id))] });
		}
		if (!!query.browsers && query.browsers.length > 0) { // equality match. 100% equal.
			userFilter.push({ $in: ['$browser', query.browsers] });
		}

		// Projecting
		const project: any = {
			current: {
				title: 1, route: 1, access: 1, folder: 1, description: 1, images: 1,
				updatedAt: 1, createdAt: 1, updatedBy: 1, createdBy: 1
			}
		};
		if (query.hasOwnProperty('unwind') && query.unwind) { // Add log data since we're unwinding
			project['current']['logDataUser'] = '$views.user';
			project['current']['logDataTs'] = '$views.ts';
			project['current']['logDataBrowser'] = '$views.browser';
			project['current']['logDataBrowserVer'] = '$views.browser_ver';
		} else { // add views count if we're not unwinding
			project['current']['views'] = { $size: '$views' };
		}

		const pipeline = [];
		pipeline.push({ $match: match });								// Match against document
		pipeline.push({													// Lookup logging data
			$lookup: {
				from: 'logs', as: 'views', let: { contentId: '$_id' },
				pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$content', '$$contentId'] }].concat(userFilter) } } }]
			}
		});
		if (query.unwind) { pipeline.push({ '$unwind': '$views' }); }	// Conditional unwind
		pipeline.push({ $project: project });							// Project results
		pipeline.push({ $replaceRoot: { newRoot: '$current' } });		// Replace root

		const results: any[] = await ContentModel.aggregate(pipeline);
		if (!results || results.length === 0) { return res.status(200).send(status(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND)); }
		return res.status(200).send(results);
	}
}

const adminAggregationSchema = {
	'$id': JSchema.AdminAggregationSchema,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'createdBy': { 'type': 'string' },
		'access': { 'type': 'string', 'enum': [accessRoles.admin, accessRoles.user, accessRoles.everyone, ''] },
		'published': { 'type': 'boolean' },
		'route': { 'type': 'string' },
		'folder': { 'type': 'string' },
		'createdAfterDate': { 'oneOf': [{ 'type': 'string', 'format': 'date-time' }, { 'type': 'string', 'maxLength': 0 }] },
		'createdBeforeDate': { 'oneOf': [{ 'type': 'string', 'format': 'date-time' }, { 'type': 'string', 'maxLength': 0 }] },
		'seenAfterDate': { 'oneOf': [{ 'type': 'string', 'format': 'date-time' }, { 'type': 'string', 'maxLength': 0 }] },
		'seenBeforeDate': { 'oneOf': [{ 'type': 'string', 'format': 'date-time' }, { 'type': 'string', 'maxLength': 0 }] },
		'readBy': { 'type': 'array', 'items': { 'type': 'string' }, 'uniqueItems': true },
		'browsers': { 'type': 'array', 'items': { 'type': 'string' }, 'uniqueItems': true },
		'unwind': { 'type': 'boolean' }
	},
};

export interface AggregationQuery {
	createdBy?: string;
	access?: accessRoles;
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

if (ajv.validateSchema(adminAggregationSchema)) {
	ajv.addSchema(adminAggregationSchema, JSchema.AdminAggregationSchema);
} else {
	console.error(`${JSchema.AdminAggregationSchema} did not validate`);
}
