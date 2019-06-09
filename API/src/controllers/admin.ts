import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { Types as MongoTypes } from 'mongoose';

import { status, ajv, JSchema, ADMIN_STATUS, CMS_STATUS, validate } from '../libs/validate';
import { ContentModel } from '../models';
import { Content, ContentEntry, AccessRoles, AggregationQuery, AggregationResult } from '../../types';

import { MongoStream } from '../libs/MongoStreamer';
import { Controller, GET, POST } from '../libs/routing';
import { Auth } from '../libs/auth';

export class AdminController extends Controller {

	/**
	 * Gets all content
	 */
	@GET({ path: '/cms/', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin)] })
	public async getAdminContentList(req: Req, res: Res, next: Next) {
		const contentList: Content[] = await ContentModel.aggregate([
			{ $lookup: { from: 'logs', localField: '_id', foreignField: 'content', as: 'logData' } },
			{ $unwind: { path: '$logData', preserveNullAndEmptyArrays: true } },
			{ $group: { _id: '$_id', current: { $first: '$current' }, views: { $sum: 1 } } },
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
	 */
	@GET({ path: '/cms/:route', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin)] })
	public async getContentFull(req: Req, res: Res, next: Next) {
		const route: string = req.params.route;

		const contentDoc =  await ContentModel.findOne(
			{ 'current.route': route },
			{ current: 1 }
		).populate([
			{ path: 'current.updatedBy', select: 'username -_id' }, // exclude _id
			{ path: 'current.createdBy', select: 'username -_id' }  // exclude _id
		]).lean() as ContentEntry;

		if (!contentDoc) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }
		res.status(200).send(contentDoc.current);
	}




	/**
	 * Aggregates Content and Log data
	 */
	@POST({ path: '/cms/aggregate', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin), validate(JSchema.AdminAggregationSchema)] })
	public async aggregateContent(req: Req, res: Res, next: Next) {
		const query: AggregationQuery = req.body;
		const unwind = query.hasOwnProperty('unwind') && query.unwind;

		// Content filtering
		const match: any[] = [];
		if (query.createdBy) { match.push({'current.createdBy': MongoTypes.ObjectId(query.createdBy) }); }		// CreatedBy
		if (query.hasOwnProperty('published')) { match.push({'current.published': query.published}); }				// Published
		if (query.route) { match.push({'current.route': query.route.toLowerCase()}); }								// Route
		if (query.folder) { match.push({'current.folder': query.folder}); }											// Folder
		if (query.access && query.access.length > 0) {																// Access
			match.push({ 'current.access': { $elemMatch: { $in: query.access } } });
		} else if (query.access && query.access.length === 0) {
			match.push({ 'current.access': { $eq: [] } });
		}
		if (!!query.createdAfterDate && !!query.createdBeforeDate) {												// CreatedAt
			match.push({'current.createdAt': { $gte: new Date(query.createdAfterDate), $lt: new Date(query.createdBeforeDate) }});
		} else if (query.createdAfterDate) {
			match.push({'current.createdAt': { $gte: new Date(query.createdAfterDate) }});
		} else if (query.createdBeforeDate) {
			match.push({'current.createdAt': { $lt: new Date(query.createdBeforeDate) }});
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
			userFilter['logData.ts'] = { $gte: new Date(query.seenAfterDate), $lt: new Date(query.seenBeforeDate) };
		} else if (!!query.seenAfterDate) {
			userFilter['logData.ts'] = { $gte: new Date(query.seenAfterDate) };
		} else if (!!query.seenBeforeDate) {
			userFilter['logData.ts'] = { $lt: new Date(query.seenBeforeDate) };
		}
		if (!!query.readBy && query.readBy.length > 0) { // Read by check (must compare against ObjectId)
			userFilter['logData.user'] = { $in: query.readBy.map(id => MongoTypes.ObjectId(id)) };
		}
		if (!!query.browsers && query.browsers.length > 0) { // equality match. 100% equal.
			userFilter['logData.browser'] = { $in: query.browsers };
		}

		// Content-LogData grouping
		const group = {
			_id: '$_id',
			current: { $first: '$current' },
			views: { $sum: 1 },
			lastVisit: { $last: '$logData.ts' }
		};

		// Projecting
		const project: any = {
			current: { title: 1, route: 1, access: 1 }
		};
		if (unwind) { // Add log data since we're unwinding
			project.current.logDataId = '$logData._id';
			project.current.logDataUser = '$logData.user';
			project.current.logDataTs = '$logData.ts';
			project.current.logDataBrowser = '$logData.browser';
			project.current.logDataBrowserVer = '$logData.browser_ver';
		} else { // Else we summarize
			project.current.views = '$views';
			project.current.lastVisit = '$lastVisit';
		}

		// Pipeline
		const pipeline: object[] = [];
		pipeline.push({ $match: match.length > 0 ? { $and: match } : {} });						// Match against document
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
					res,
					query: () => ContentModel.aggregate(pipeline),
					errStatus: status(ADMIN_STATUS.AGGREGATION_MONGOOSE_ERROR),
					noneFoundStatus: status(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND)
				});
			} else {
				const results: AggregationResult[] = await ContentModel.aggregate(pipeline).allowDiskUse(true);
				if (!results || results.length === 0) { return res.status(200).send(status(ADMIN_STATUS.AGGREGATION_RESULT_NONE_FOUND)); }
				return res.status(200).send(results);
			}
		} catch (e) {
			return res.status(200).send(status(ADMIN_STATUS.AGGREGATION_MONGOOSE_ERROR));
		}
	}
}

/*
 |--------------------------------------------------------------------------
 | JSON schema
 |--------------------------------------------------------------------------
*/

const adminAggregationSchema = {
	$id: JSchema.AdminAggregationSchema.name,
	type: 'object',
	additionalProperties: false,
	properties: {
		createdBy: { type: 'string' },
		access: { type: 'array', items: { type: 'string', enum: Object.values(AccessRoles) }, uniqueItems: true },
		published: { type: 'boolean' },
		route: { type: 'string' },
		folder: { type: 'string' },
		createdAfterDate: { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'string', maxLength: 0 }] },
		createdBeforeDate: { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'string', maxLength: 0 }] },
		seenAfterDate: { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'string', maxLength: 0 }] },
		seenBeforeDate: { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'string', maxLength: 0 }] },
		readBy: { type: 'array', items: { type: 'string' }, uniqueItems: true },
		browsers: { type: 'array', items: { type: 'string' }, uniqueItems: true },
		unwind: { type: 'boolean' }
	},
};

if (ajv.validateSchema(adminAggregationSchema)) {
	ajv.addSchema(adminAggregationSchema, JSchema.AdminAggregationSchema.name);
} else {
	throw Error(`${JSchema.AdminAggregationSchema.name} did not validate`);
}

