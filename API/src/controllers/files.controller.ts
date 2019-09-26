import { Request as Req, Response as Res, NextFunction as Next } from 'express';
import { Controller, RouteDomain, GET, POST, DELETE, PATCH } from '../libs/routing';

import { UploadedFile } from 'express-fileupload';

import { Auth } from '../libs/auth';
import { Filestore } from '../libs/filestore';
import { sanitize } from '../libs/sanitizer';

import { FileModel } from '../models';

// Types and global settings
import { JWTUser, AccessRoles, FileData, FileThumbnail, FileUploadStatus, FileDataObject } from '../../types';
import { status, FILE_STATUS, RegisterSchema, JSchema, validate } from '../libs/validate';
import { FILE_MAX_LENGTH } from '../../global';



@RouteDomain('/files')
export class FilesController extends Controller {
	private static readonly FileURLRegex = new RegExp('^(.+)_([0-9]+)\.(.+)$');

	/**
	 * Uploads an image and returns a URL to the retrieve the image
	 */
	@POST({ path: '/', do: [Auth.Personalize] })
	public async uploadImage(req: Req, res: Res, next: Next) {
		// Auth is handled within the controller handler because we need custom error handling
		const unauth = Auth.CanUserAccess(req.user as JWTUser, AccessRoles.writer);
		if (!unauth) {
			return res.status(401).send({ error: 'Unauthorized' });
		}

		const fileInfo = req.files && req.files.file as UploadedFile;

		// const result = await Filestore.uploadImage(fileInfo, req.header('origin'));
		const result = await Filestore.uploadImageToDatabase(fileInfo, req.user as JWTUser);

		switch (result.status) {
			case FileUploadStatus.SUCCESS:
				return res.status(200).send(result.urls);
			case FileUploadStatus.ERROR_NO_FILE:
			case FileUploadStatus.ERROR_BAD_FILE:
				return res.status(400).send({ error: FILE_STATUS.ERROR_BAD_FILE });
			case FileUploadStatus.ERROR_BAD_UPLOAD_FOLDER:
				return res.status(400).send({ error: FILE_STATUS.ERROR_BAD_UPLOAD_FOLDER });
			case FileUploadStatus.ERROR_IMAGE_TOO_LARGE:
				return res.status(400).send({ error: FILE_STATUS.ERROR_BAD_UPLOAD_FOLDER });
			case FileUploadStatus.ERROR_WRITING:
				return res.status(400).send({ error: FILE_STATUS.ERROR_WRITING });
		}
	}


	@GET({ path: '/', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async getListOfAllImages(req: Req, res: Res, next: Next) {
		const files: FileData[] = await FileModel.find(
			{},
			{ uuid: 1, title: 1, uploadedBy: 1, uploadedDate: 1 }
		).populate({ path: 'uploadedBy', select: 'username -_id' }).lean(); // exclude _id


		if (!files) {
			return res.status(404).send(status(FILE_STATUS.NO_FILES_FOUND));
		}
		res.send(files.map<FileThumbnail>(file => {
			return {
				thumbnail: Filestore.getFileURL(file.uuid, Filestore.IMAGE_SIZES[0]),
				title: file.title,
				uploadedBy: file.uploadedBy,
				uploadedDate: file.uploadedDate,
				uuid: file.uuid
			};
		}));
	}

	@GET({ path: '/:uuid', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async getFile(req: Req, res: Res, next: Next) {
		return res.status(200).send(Filestore.getURLsForAllSizes(req.params.uuid));
	}


	@DELETE({ path: '/:uuid', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async deleteFile(req: Req, res: Res, next: Next) {
		const uuid: string = req.params.uuid;

		const deleted = await FileModel.deleteOne({ uuid }).lean();
		if (deleted.deletedCount > 0) {
			return res.status(200).send(status(FILE_STATUS.DELETE_SUCCESSFUL));
		}

		return res.status(404).send(status(FILE_STATUS.NO_FILES_FOUND));
	}


	@PATCH({ path: '/:uuid', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer), validate(JSchema.FileDataSchema)] })
	public async patchFile(req: Req, res: Res, next: Next) {
		const uuid: string = req.params.uuid;
		const data: FileData = req.body;

		const updatedFile = await FileModel.findOneAndUpdate(
			{ uuid },
			{
				$set: {
					title: sanitize(data.title)
				},
			},
			{ new: true, projection: { data: false } }
		).lean();

		if (!updatedFile) { return res.status(500).send(status(FILE_STATUS.DATA_UNABLE_TO_SAVE)); }
		return res.status(200).send(updatedFile);
	}


	@GET({ path: '/download/:fileURL', do: [] })
	public async getImage(req: Req, res: Res, next: Next) {
		const fileURL: string = req.params.fileURL;
		try {
			const [_, uuidKey, size, extension] = FilesController.FileURLRegex.exec(fileURL);

			const projectionObj: any = {};
			projectionObj['data.' + size] = 1;
			projectionObj.mimeType = 1;

			const file: FileData = await FileModel.findOne({ uuid: uuidKey }, projectionObj).lean();
			if (!file) {
				return res.sendStatus(404);
			}

			const buffer = (file.data as FileDataObject)[size].buffer;
			res.writeHead(200, {
				'Content-Type': file.mimeType,
				'Content-Disposition': `attachment; filename=${fileURL}`,
				'Content-Length': buffer.length,
				'Cache-Control': 'max-age=31536000'
			});
			res.end(buffer);
		} catch {
			return res.sendStatus(404);
		}

	}


	// ---------------------------------------
	// ------------ JSON SCHEMAS -------------
	// ---------------------------------------

	@RegisterSchema(JSchema.FileDataSchema)
	public get patchFileSchema() {
		return {
			type: 'object',
			additionalProperties: false,
			properties: {
				title: {
					type: 'string',
					maxLength: FILE_MAX_LENGTH.TITLE
				},
			},
			required: ['title']
		};
	}
}
