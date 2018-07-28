import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { ajv, JSchema } from '../libs/validate';
import { UAParser } from 'ua-parser-js';

import { User, accessRoles } from '../models/user';
import { Log, LogModel } from '../models/log';
import { ContentModel, Content, ContentDoc } from '../models/content';

import { status, ROUTE_STATUS, CMS_STATUS } from '../libs/validate';
import { sanitize, stripHTML } from '../libs/sanitizer';

import { util as configUtil } from 'config';
import { escape, isURL } from 'validator';

const isProduction = configUtil.getEnv('NODE_ENV') === 'production';

export class CMSController {

	private static ImageSrcRegex = /<img[^>]*src="([^"]*)"/g;

	/**
	 * Retrieves the src of the first image if found.
	 * @param html
	 */
	private static getImageSrcFromContent(html: string) {
		// entire match, grouping, index, entire input
		const images: string[] = [];

		let match = CMSController.ImageSrcRegex.exec(html);
		while (match != null) {
			images.push(match[1]);
			match = CMSController.ImageSrcRegex.exec(html);
		}
		return images;
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
			{ $match: { 'current.access': { $in: accessRights }, 'current.nav': true, 'current.published': true } },
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
	 * Gets content of a given route, declared by the param
	 * @param  {Req}		req  request
	 * @param  {Res}		res  response
	 * @param  {Next}		next next
	 * @return {Res}		server response: the content object
	 */
	public static async getContent(req: Req, res: Res, next: Next) {
		const route: string = req.params.route,
			user: User = <User>req.user;

		const contentDoc = <ContentDoc>await ContentModel.findOne(
			{ 'current.route': route, 'current.published': true },
			{
				'current.title': 1, 'current.access': 1, 'current.route': 1, 'current.content': 1, 'current.description': 1,
				'current.updatedBy': 1, 'current.createdBy': 1, 'current.updatedAt': 1, 'current.createdAt': 1,
				'current.images': 1
			}
		).populate([
			{ path: 'current.updatedBy', select: 'username -_id' }, // exclude _id
			{ path: 'current.createdBy', select: 'username -_id' }  // exclude _id
		]);

		if (!contentDoc) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }

		const access = contentDoc.current.access === accessRoles.everyone || (user && user.canAccess(contentDoc.current.access));
		if (!access) { return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED)); }

		res.status(200).send(contentDoc.current);

		// Logging
		const dnt = req.headers.dnt && isProduction; // Do not track header
		const log = <Log>{
			user: (user && !dnt) ? user._id : undefined,
			route: contentDoc.current.route,
			content: contentDoc._id,
			ts: new Date()
		};
		if (!dnt) {
			const browser = new UAParser(<string>req.headers['user-agent']).getBrowser();
			if (browser && browser.name) {
				log.browser = browser.name;
				log.browser_ver = browser.version;
			}
		}
		new LogModel(log).save();
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

		const contentDoc = await ContentModel.findOne({ 'current.route': route }, {
			current: true, prev: true
		});
		if (!contentDoc) {
			return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND));
		}
		return res.status(200).send(contentDoc.prev); // length of 0 is also status 200
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
			published: data.published,
			access: data.access,
			version: 0,
			content: sanitizedContent,
			content_searchable: stripHTML(data.content),
			description: sanitize(data.description),
			images: CMSController.getImageSrcFromContent(sanitizedContent),
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
			published: data.published,
			access: data.access,
			version: contentDoc.current.version + 1,
			content: sanitizedContent,
			content_searchable: stripHTML(data.content),
			description: sanitize(data.description),
			images: CMSController.getImageSrcFromContent(sanitizedContent),
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

		const result: { n: number, ok: number } = await ContentModel.remove({ 'current.route': route }).lean();
		if (result.n === 0) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }
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
			{ $match: { $text: { $search: searchTerm }, 'current.access': { $in: accessRights }, 'current.published': true } },
			{ $lookup: { from: 'logs', localField: '_id', 'foreignField': 'content', as: 'views' } },
			{ $sort: { score: { $meta: 'textScore' } } },
			{ $limit: 1000 },
			{
				$project: {
					current: {
						title: 1, route: 1, access: 1, folder: 1, updatedAt: 1, views: { $size: '$views' },
						description: 1, images: 1, relevance: { $meta: 'textScore' }
					}
				}
			},
			{ $replaceRoot: { newRoot: '$current' } },
		]);
		if (!contentList || contentList.length === 0) { return res.status(200).send(status(CMS_STATUS.SEARCH_RESULT_NONE_FOUND)); }
		return res.status(200).send(contentList);
	}
}

/*
 |--------------------------------------------------------------------------
 | JSON schema
 |--------------------------------------------------------------------------
*/

const maxShortInputLength = 25;
const maxLongInputLength = 300;

const createPatchContentSchema = {
	'$id': JSchema.ContentSchema,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'title': {
			'type': 'string',
			'maxLength': maxShortInputLength
		},
		'access': {
			'type': 'string',
			'enum': [accessRoles.admin, accessRoles.user, accessRoles.everyone]
		},
		'published': {
			'type': 'boolean'
		},
		'route': {
			'type': 'string',
			'maxLength': maxShortInputLength
		},
		'content': {
			'type': 'string'
		},
		'description': {
			'type': 'string',
			'maxLength': maxLongInputLength
		},
		'folder': {
			'type': 'string',
			'maxLength': maxShortInputLength
		},
		'nav': {
			'type': 'boolean'
		}
	},
	'required': ['title', 'published', 'access', 'route', 'content', 'description', 'folder', 'nav']
};

if (ajv.validateSchema(createPatchContentSchema)) {
	ajv.addSchema(createPatchContentSchema, JSchema.ContentSchema);
} else {
	console.error(`${JSchema.ContentSchema} did not validate`);
}

