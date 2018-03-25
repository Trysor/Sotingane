import { Request as Req, Response as Res, NextFunction as Next } from 'express';
import { User, accessRoles } from '../models/user';
import { ContentModel, Content, ContentDoc } from '../models/content';
import { status, ROUTE_STATUS, CMS_STATUS } from '../libs/validate';
import { escape, isURL } from 'validator';
import { sanitize, stripHTML } from '../libs/sanitizer';


export class CMSController {

	private static ImageSrcRegex = /<img[^>]*src="([^"]*)"/g;

	/**
	 * Retrieves the src of the first image if found.
	 * @param html
	 */
	private static getImageSrcFromContent(html: string): string {
		// entire match, grouping, index, entire input
		const match = CMSController.ImageSrcRegex.exec(html);
		return match ? match[1] : undefined;
	}


	/**
	 * Gets all content routes that the user has access to, and that are visible in the navigation
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: a list of partial content information
	 */
	public static async getContentList(req: Req, res: Res, next: Next) {
		const user: User = <User>req.user;

		const accessRights: accessRoles[] = [accessRoles.everyone];
		if (user) {
			accessRights.push(accessRoles.user);
			if (user.role === accessRoles.admin) { accessRights.push(accessRoles.admin); }
		}

		const contentList: Content[] = await ContentModel.aggregate([
			{ $match: { 'current.access': { $in: accessRights }, 'current.nav': true } },
			{
				$project: { current: { title: 1, route: 1, folder: 1 } }
			},
			{ $replaceRoot: { newRoot: '$current' } }
		]);
		if (!contentList) {
			return res.status(404).send(status(CMS_STATUS.NO_ROUTES));
		}
		res.status(200).send(contentList);
	}

	/**
	 * Gets all content
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: a list of partial content information
	 */
	public static async getAdminContentList(req: Req, res: Res, next: Next) {
		const contentList: Content[] = await ContentModel.aggregate([
			{
				$project: {
					current: {
						title: 1, route: 1, access: 1, updatedAt: 1, createdAt: 1,
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
	 * Gets content of a given route, declared by the param
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the content object
	 */
	public static async getContent(req: Req, res: Res, next: Next) {
		const route: string = req.params.route,
			user: User = <User>req.user;

		const contentDoc = <ContentDoc>await ContentModel.findOneAndUpdate(
			{ 'current.route': route },
			{ $inc: { 'views': 1 } },
			{ fields: { prev: 0, 'current.content_searchable': 0, 'current.image': 0 } }
		).populate([
			{ path: 'current.updatedBy', select: 'username -_id' }, // exclude _id
			{ path: 'current.createdBy', select: 'username -_id' }  // exclude _id
		]);

		if (!contentDoc) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }

		const access = contentDoc.current.access === accessRoles.everyone || (user && user.canAccess(contentDoc.current.access));
		if (!access) { return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED)); }

		res.status(200).send(contentDoc.current);
	}



	/**
	 * Gets content history of a given route
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the content history array
	 */
	public static async getContentHistory(req: Req, res: Res, next: Next) {
		const route: string = req.params.route,
			user: User = <User>req.user;

		if (!user.isOfRole(accessRoles.admin)) {
			return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED));
		}

		const contentDoc = await ContentModel.findOne({ 'current.route': route }, {
			current: true, prev: true
		});
		if (!contentDoc || contentDoc.prev.length === 0) {
			return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND));
		}
		return res.status(200).send(contentDoc.prev);
	}




	/**
	 * Creates new content
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the contentDoc.current object
	 */
	public static async createContent(req: Req, res: Res, next: Next) {
		const data: Content = req.body,
			user: User = <User>req.user;

		if (!user.isOfRole(accessRoles.admin)) {
			return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED));
		}

		// insert ONLY sanitized and escaped data!
		const sanitizedContent = sanitize(data.content);

		const newCurrent: Content = {
			title: escape(data.title),
			route: escape(data.route.replace(/\//g, '')).toLowerCase(),
			access: data.access,
			version: 0,
			content: sanitizedContent,
			content_searchable: stripHTML(data.content),
			description: sanitize(data.description),
			image: CMSController.getImageSrcFromContent(sanitizedContent),
			nav: !!data.nav,
			createdBy: user._id,
			updatedBy: user._id,
			updatedAt: new Date(),
			createdAt: new Date()
		};
		if (data.folder) { newCurrent.folder = stripHTML(data.folder).replace(/\//g, ''); }

		const newContentDoc = await new ContentModel({ current: newCurrent }).save();

		if (!newContentDoc) { return res.status(500).send(status(CMS_STATUS.DATA_UNABLE_TO_SAVE)); }
		return res.status(200).send(newContentDoc.current);
	}




	/**
	 * Updates content
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the updated content object
	 */
	public static async patchContent(req: Req, res: Res, next: Next) {
		const route: string = req.params.route,
			data: Content = req.body,
			user: User = <User>req.user;

		if (!user.isOfRole(accessRoles.admin)) {
			return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED));
		}

		// Fetch current version
		const contentDoc = <ContentDoc>await ContentModel.findOne({ 'current.route': route }, { prev: false }).lean();

		if (!contentDoc) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }

		const sanitizedContent = sanitize(data.content);
		const patched = {
			title: escape(data.title),
			route: escape(data.route.replace(/\//g, '')).toLowerCase(),
			access: data.access,
			version: contentDoc.current.version + 1,
			content: sanitizedContent,
			content_searchable: stripHTML(data.content),
			description: sanitize(data.description),
			image: CMSController.getImageSrcFromContent(sanitizedContent),
			nav: !!data.nav,
			folder: data.folder ? stripHTML(data.folder).replace(/\//g, '') : '',
			updatedBy: user._id,
			updatedAt: new Date(),
			createdBy: contentDoc.current.createdBy,
			createdAt: contentDoc.current.createdAt
		};

		const updated = await ContentModel.findByIdAndUpdate(contentDoc._id,
			{
				$set: { current: patched },
				$push: { prev: { $each: [contentDoc.current], $position: 0, $slice: 10 } }
			},
			{ new: true }
		);

		if (!updated) { return res.status(500).send(status(CMS_STATUS.DATA_UNABLE_TO_SAVE)); }
		return res.status(200).send(updated.current);
	}

	/**
	 * Deletes content of a given route, declared by the param
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: message declaring success or failure
	 */
	public static async deleteContent(req: Req, res: Res, next: Next) {
		const route: string = req.params.route,
			user: User = <User>req.user;

		if (!user.isOfRole(accessRoles.admin)) {
			return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED));
		}

		await ContentModel.remove({ 'current.route': route }).lean();
		// if (err) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }
		return res.status(200).send(status(CMS_STATUS.CONTENT_DELETED));
	}



	/**
	 * Returns search results for a given search term provided in the body
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the search results
	 */
	public static async searchContent(req: Req, res: Res, next: Next) {
		const searchTerm: string = req.params.searchTerm || '',
			user: User = <User>req.user;

		const accessRights: accessRoles[] = [accessRoles.everyone];
		if (user) {
			accessRights.push(accessRoles.user);
			if (user.role === accessRoles.admin) { accessRights.push(accessRoles.admin); }
		}

		const contentList: Content[] = await ContentModel.aggregate([
			{ $match: { $text: { $search: searchTerm }, 'current.access': { $in: accessRights } } },
			{ $sort: { score: { $meta: 'textScore' } } },
			{ $limit: 1000 },
			{
				$project: {
					current: {
						title: 1, route: 1, access: 1, folder: 1, updatedAt: 1, views: '$views',
						description: 1, image: 1, relevance: { $meta: 'textScore' }
					}
				}
			},
			{ $replaceRoot: { newRoot: '$current' } },
		]);
		if (!contentList || contentList.length === 0) { return res.status(404).send(status(CMS_STATUS.SEARCH_RESULT_NONE_FOUND)); }
		return res.status(200).send(contentList);
	}
}
