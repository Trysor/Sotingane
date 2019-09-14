import { Request as Req, Response as Res, NextFunction as Next } from 'express';

// Libs
import { UAParser } from 'ua-parser-js';
import { escape } from 'validator';
import { sanitize, stripHTML } from '../libs/sanitizer';
import { status, JSchema, ROUTE_STATUS, CMS_STATUS, validate, RegisterSchema } from '../libs/validate';
import { Controller, GET, POST, PATCH, DELETE, isProduction } from '../libs/routing';
import { Auth } from '../libs/auth';
import { ImageSize } from '../libs/imageSize';

// Models
import { LogModel, ContentModel } from '../models';

// Types and global settings
import { JWTUser, AccessRoles, Log, Content, ContentEntry } from '../../types';
import { CONTENT_MAX_LENGTH } from '../../global';




export class CMSController extends Controller {
	private static ImageSrcRegex = /<img[^>]*src="([^"]*)"/g;

	/**
	 * Retrieves the src of the first image if found.
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
	 */
	@GET({ path: '/', do: [Auth.Personalize] })
	public async getContentList(req: Req, res: Res, next: Next) {
		const user = req.user as JWTUser;

		const match = Auth.getUserAccessMatchObject(user, {
			'current.nav': true,
			'current.published': true
		});

		const contentList: Content[] = await ContentModel.aggregate([
			{ $match: match },
			{ $project: { current: { title: 1, route: 1, folder: 1 } } },
			{ $replaceRoot: { newRoot: '$current' } }
		]);
		if (!contentList) {
			res.status(404).send(status(CMS_STATUS.NO_ROUTES));
		} else {
			res.status(200).send(contentList);
		}
	}

	/**
	 * Gets content of a given route, declared by the param
	 */
	@GET({ path: '/:route', do: [Auth.Personalize] })
	public async getContent(req: Req, res: Res, next: Next) {
		const route: string = req.params.route;
		const user = req.user as JWTUser;

		const contentDoc: ContentEntry = await ContentModel.findOne(
			{ 'current.route': route, 'current.published': true },
			{
				'current.title': 1, 'current.access': 1, 'current.route': 1, 'current.content': 1, 'current.description': 1,
				'current.updatedBy': 1, 'current.createdBy': 1, 'current.updatedAt': 1, 'current.createdAt': 1,
				'current.images.height': 1, 'current.images.width': 1, 'current.images.url': 1
			}
		).populate([
			{ path: 'current.updatedBy', select: 'username' },
			{ path: 'current.createdBy', select: 'username' }
		]).lean();

		if (!contentDoc) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }

		if (!Auth.CanUserAccess(user, contentDoc.current.access, contentDoc.current.createdBy)) {
			return res.status(401).send(status(ROUTE_STATUS.UNAUTHORISED));
		}

		res.status(200).send(contentDoc.current);

		// Logging
		const dnt = req.headers.dnt && isProduction; // Do not track header
		const log = {
			user: (user && !dnt) ? user._id : undefined,
			route: contentDoc.current.route,
			content: contentDoc._id,
			ts: new Date()
		} as Log;
		if (user || !dnt) {
			const browser = new UAParser(req.headers['user-agent']).getBrowser();
			if (browser && browser.name) {
				log.browser = browser.name;
				log.browser_ver = browser.version;
			}
		}
		new LogModel(log).save();
	}


	/**
	 * Gets content history of a given route
	 */
	@GET({ path: '/history/:route', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async getContentHistory(req: Req, res: Res, next: Next) {
		const route: string = req.params.route;

		const contentDoc = await ContentModel.findOne({ 'current.route': route }, {
			current: true, prev: true
		}).lean();
		if (!contentDoc) {
			return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND));
		}
		return res.status(200).send(contentDoc.prev); // length of 0 is also status 200
	}




	/**
	 * Creates new content
	 */
	@POST({ path: '/', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer), validate(JSchema.ContentSchema)] })
	@PATCH({ path: '/:route', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer), validate(JSchema.ContentSchema)] })
	public async submitContent(req: Req, res: Res, next: Next) {
		const isPatch = (!!req.params && !!req.params.route);
		const data: Content = req.body;
		const user = req.user as JWTUser;

		let existingDoc: ContentEntry;
		if (isPatch) {
			existingDoc = await ContentModel.findOne({ 'current.route': req.params.route }, { prev: false }).lean();
			if (!existingDoc) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }
		}

		// insert ONLY sanitized and escaped data!
		const sanitizedContent = sanitize(data.content);
		const imageUrls = CMSController.getImageSrcFromContent(sanitizedContent);
		const searchable = stripHTML(sanitizedContent);

		const contentToSubmit: Content = {
			title: escape(data.title),
			route: escape(data.route.replace(/\//g, '')).toLowerCase(),
			published: data.published,
			access: data.access,
			version: isPatch ? existingDoc.current.version + 1 : 0,
			content: sanitizedContent,
			content_searchable: searchable ? searchable + ' ' : ' ',
			description: sanitize(data.description),
			images: await ImageSize.imageDataFromURLs(imageUrls),
			nav: !!data.nav,
			folder: data.folder ? stripHTML(data.folder).replace(/\//g, '') : '',
			createdBy: isPatch ? existingDoc.current.createdBy : user._id,
			updatedBy: user._id,
			updatedAt: new Date(),
			createdAt: isPatch ? existingDoc.current.createdAt : new Date()
		};

		let updatedContent: ContentEntry;
		if (isPatch) {
			updatedContent = await ContentModel.findByIdAndUpdate(existingDoc._id,
				{
					$set: { current: contentToSubmit },
					$push: { prev: { $each: [existingDoc.current], $position: 0, $slice: 10 } }
				},
				{ new: true }
			).lean();
		} else {
			updatedContent = await new ContentModel({ current: contentToSubmit }).save();
		}

		if (!updatedContent) { return res.status(500).send(status(CMS_STATUS.DATA_UNABLE_TO_SAVE)); }
		return res.status(200).send(updatedContent.current);
	}

	/**
	 * Deletes content of a given route, declared by the param
	 */
	@DELETE({ path: '/:route', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async deleteContent(req: Req, res: Res, next: Next) {
		const route: string = req.params.route;
		const result: { n: number, ok: number } = await ContentModel.deleteOne({ 'current.route': route }).lean();
		if (result.n === 0) { return res.status(404).send(status(CMS_STATUS.CONTENT_NOT_FOUND)); }
		return res.status(200).send(status(CMS_STATUS.CONTENT_DELETED));
	}


	/**
	 * Returns search results for a given search term provided in the body
	 */
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


	// ---------------------------------------
	// ------------ JSON SCHEMAS -------------
	// ---------------------------------------

	@RegisterSchema(JSchema.ContentSchema)
	public get submitContentSchema() {
		return {
			type: 'object',
			additionalProperties: false,
			properties: {
				title: {
					type: 'string',
					maxLength: CONTENT_MAX_LENGTH.TITLE
				},
				access: {
					type: 'array',
					items: {
						type: 'string',
						enum: Object.values(AccessRoles)
					},
					uniqueItems: true
				},
				published: {
					type: 'boolean'
				},
				route: {
					type: 'string',
					maxLength: CONTENT_MAX_LENGTH.ROUTE
				},
				content: {
					type: 'string'
				},
				description: {
					type: 'string',
					maxLength: CONTENT_MAX_LENGTH.DESC
				},
				folder: {
					type: 'string',
					maxLength: CONTENT_MAX_LENGTH.FOLDER
				},
				nav: {
					type: 'boolean'
				}
			},
			required: ['title', 'published', 'access', 'route', 'content', 'description', 'folder', 'nav']
		};
	}
}
