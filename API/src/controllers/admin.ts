import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import * as mongoose from 'mongoose';

import { status, ajv, JSchema, ADMIN_STATUS, CMS_STATUS, VALIDATION_FAILED, validateSchema } from '../libs/validate';
import { accessRoles, ContentModel, Content, ContentEntry } from '../models';

import { MongoStream } from '../libs/MongoStreamer';
import { Controller, GET, POST } from '../libs/routing';
import { Auth } from '../libs/auth';

export class AdminController extends Controller {

	/**
	 * Gets all content
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: a list of partial content information
	 */
	@GET({ path: '/cms/', handlers: [Auth.ByToken, Auth.RequireRole(accessRoles.admin)] })
	public async getAdminContentList(req: Req, res: Res, next: Next) {
		const contentList: Content[] = await ContentModel.aggregate([
			{ $lookup: { from: 'logs', localField: '_id', foreignField: 'content', as: 'logData' } },
			{ $unwind: { path: '$logData', preserveNullAndEmptyArrays: true } },
			{ $group: { _id: '$_id', 'current': { $first: '$current' }, 'views': { $sum: 1 } } },
			{
				$project: {
					current: {
						title: 1, route: 1, published: 1, access: 1, updatedAt: 1, createdAt: 1,
						folder: 1, description: 1, nav: 1, views: '$views'
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
	@GET({ path: '/cms/:route', handlers: [Auth.ByToken, Auth.RequireRole(accessRoles.admin)] })
	public async getContentFull(req: Req, res: Res, next: Next) {
		const route: string = req.params.route;

		const contentDoc = <ContentEntry>await ContentModel.findOne(
			{ 'current.route': route },
			{ 'current': 1 }
		).populate([
			{ path: 'current.updatedBy', select: 'username -_id' }, // exclude _id
			{ path: 'current.createdBy', select: 'username -_id' }  // exclude _id
		]).lean();

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
	@POST({
		path: '/cms/aggregate', handlers: [
			Auth.ByToken, Auth.RequireRole(accessRoles.admin),
			validateSchema(JSchema.AdminAggregationSchema, VALIDATION_FAILED.ADMIN_MODEL),
		]
	})
	public async aggregateContent(req: Req, res: Res, next: Next) {
		const query: AggregationQuery = req.body;
		const unwind = query.hasOwnProperty('unwind') && query.unwind;

		// Content filtering
		const match: any = {};
		if (query.createdBy) { match['current.createdBy'] = mongoose.Types.ObjectId(query.createdBy); }		// CreatedBy
		if (query.access) { match['current.access'] = query.access; }										// Access
		if (query.hasOwnProperty('published')) { match['current.published'] = query.published; }			// Published
		if (query.route) { match['current.route'] = query.route.toLowerCase(); }							// Route
		if (query.folder) { match['current.folder'] = query.folder; }										// Folder

		if (!!query.createdAfterDate && !!query.createdBeforeDate) {										// CreatedAt
			match['current.createdAt'] = { '$gte': new Date(query.createdAfterDate), '$lt': new Date(query.createdBeforeDate) };
		} else if (query.createdAfterDate) {
			match['current.createdAt'] = { '$gte': new Date(query.createdAfterDate) };
		} else if (query.createdBeforeDate) {
			match['current.createdAt'] = { '$lt': new Date(query.createdBeforeDate) };
		}

		// Early project
		const earlyProject = {
			current: {
				createdBy: 1, access: 1, published: 1, route: 1, title: 1, folder: 1, createdAt: 1
			}
		};

		// Lookup and unwind
		const lookup = { from: 'logs', localField: '_id', foreignField: 'content', as: 'logData' };
		const unwindPipeline = { path: '$logData', preserveNullAndEmptyArrays: true };

		// LogData filtering
		const userFilter: any = {};
		if (!!query.seenAfterDate && !!query.seenBeforeDate) {
			userFilter['logData.ts'] = { '$gte': new Date(query.seenAfterDate), '$lt': new Date(query.seenBeforeDate) };
		} else if (!!query.seenAfterDate) {
			userFilter['logData.ts'] = { '$gte': new Date(query.seenAfterDate) };
		} else if (!!query.seenBeforeDate) {
			userFilter['logData.ts'] = { '$lt': new Date(query.seenBeforeDate) };
		}
		if (!!query.readBy && query.readBy.length > 0) { // Read by check (must compare against ObjectId)
			userFilter['logData.user'] = { $in: query.readBy.map(id => mongoose.Types.ObjectId(id)) };
		}
		if (!!query.browsers && query.browsers.length > 0) { // equality match. 100% equal.
			userFilter['logData.browser'] = { $in: query.browsers };
		}

		// Content-LogData grouping
		const group = {
			_id: '$_id',
			'current': { $first: '$current' },
			'views': { $sum: 1 },
			'lastVisit': { $last: '$logData.ts' }
		};

		// Projecting
		const project: any = {
			current: { title: 1, route: 1, access: 1 }
		};
		if (unwind) { // Add log data since we're unwinding
			project['current']['logDataId'] = '$logData._id';
			project['current']['logDataUser'] = '$logData.user';
			project['current']['logDataTs'] = '$logData.ts';
			project['current']['logDataBrowser'] = '$logData.browser';
			project['current']['logDataBrowserVer'] = '$logData.browser_ver';
		} else { // Else we summarize
			project['current']['views'] = '$views';
			project['current']['lastVisit'] = '$lastVisit';
		}

		// Pipeline
		const pipeline: object[] = [];
		pipeline.push({ $match: match });								// Match against document
		pipeline.push({ $project: earlyProject });						// Exclude uneeded data early
		pipeline.push({ $lookup: lookup });								// Lookup logData
		pipeline.push({ $unwind: unwindPipeline });						// Always unwind
		pipeline.push({ $match: userFilter });							// Run another match to filter on logData
		if (!unwind) { pipeline.push({ $group: group }); }				// Group up if we're aggregating log data
		pipeline.push({ $project: project });							// Project results
		pipeline.push({ $replaceRoot: { newRoot: '$current' } });		// Replace root

		try {
			// Allow disk usage for this particular aggregation
			const stream = true;
			if (stream) {
				return MongoStream({
					type: 'aggregation',
					res: res,
					query: () => ContentModel.aggregate(pipeline),
					errStatus: status(ADMIN_STATUS.AGGREGATION_MONGOOSE_ERROR),
					noneFoundStatus: status(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND)
				});
			} else {
				const results: any[] = await ContentModel.aggregate(pipeline).allowDiskUse(true);
				if (!results || results.length === 0) { return res.status(200).send(status(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND)); }
				return res.status(200).send(results);
			}



		} catch (e) {
			return res.status(200).send(status(ADMIN_STATUS.AGGREGATION_MONGOOSE_ERROR));
		}
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

