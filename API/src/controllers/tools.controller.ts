
import { Request as Req, Response as Res, NextFunction as Next } from 'express';

// Libs
import { status, CMS_STATUS, } from '../libs/validate';
import { Controller, RouteDomain, GET } from '../libs/routing';
import { Auth } from '../libs/auth';

// Models
import { ContentModel } from '../models';

// Types and global settings
import { JWTUser, Content, AccessRoles, ContentEntry } from '../../types';


@RouteDomain('/tools')
export class ToolsController extends Controller {


	/**
	 * Gets content history of a given route
	 */
	@GET({ path: '/history/:route', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async getContentHistory(req: Req, res: Res, next: Next) {
		const route: string = req.params.route;

		const contentDoc = await ContentModel.findOne({ 'current.route': route }, {
			current: true, prev: true
		}).lean<ContentEntry>();
		if (!contentDoc) {
			return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND));
		}
		return res.status(200).send(contentDoc.prev); // length of 0 is also status 200
	}

	/**
	 * Gets content history of a given route
	 */
	@GET({ path: '/tags', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async getTags(req: Req, res: Res, next: Next) {

		const user = req.user as JWTUser;

		const match = Auth.getUserAccessMatchObject(user, {});

		const unwoundDocs: any[] = await ContentModel.aggregate([
			{ $match: match },
			{ $replaceRoot: { newRoot: '$current' } },
			{ $project: { tags: 1 } },
			{ $unwind : '$tags' }
		]).allowDiskUse(true);

		const tags = unwoundDocs?.length > 0 && unwoundDocs.map(x => x.tags as string) || [];
		return res.status(200).send(tags); // length of 0 is also status 200
	}


	/**
	 * Returns search results for a given search term provided in the body
	 */
	@GET({ path: '/search', do: [Auth.Personalize] })
	@GET({ path: '/search/:searchTerm', do: [Auth.Personalize] })
	public async searchContent(req: Req, res: Res, next: Next) {
		const searchTerm: string = req.params.searchTerm || '';
		const user = req.user as JWTUser;


		const match = Auth.getUserAccessMatchObject(user, {
			$text: { $search: searchTerm },
			'current.published': true
		});

		try {
			const contentList: Content[] = await ContentModel.aggregate([
				{ $match: match },
				{ $project: { current: 1, relevance: { $meta: 'textScore' } } },
				{ $lookup: { from: 'logs', localField: '_id', foreignField: 'content', as: 'logData' } },
				{ $unwind: { path: '$logData', preserveNullAndEmptyArrays: true } },
				{ $group: { _id: '$_id', current: { $first: '$current' }, views: { $sum: 1 }, relevance: { $first: '$relevance' } } },
				{ $sort: { relevance: 1 } },
				{ $limit: 1000 },
				{
					$project: {
						current: {
							title: 1, route: 1, access: 1, folder: 1, updatedAt: 1, views: '$views',
							description: 1, relevance: '$relevance',
							images: { height: 1, width: 1, url: 1 }
						}
					}
				},
				{ $replaceRoot: { newRoot: '$current' } }
			]).allowDiskUse(true);

			if (!contentList || contentList.length === 0) { return res.status(200).send(status(CMS_STATUS.SEARCH_RESULT_NONE_FOUND)); }
			return res.status(200).send(contentList);

		} catch (e) {
			return res.status(200).send(status(CMS_STATUS.SEARCH_RESULT_MONGOOSE_ERROR));
		}
	}
}
