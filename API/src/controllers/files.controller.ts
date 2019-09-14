import { Request as Req, Response as Res, NextFunction as Next } from 'express';
import { Controller, GET, POST, PATCH, DELETE, isProduction } from '../libs/routing';

import { Auth } from '../libs/auth';
import { UploadedFile } from 'express-fileupload';
import { Filestore, UploadStatus } from '../libs/filestore';

import { FileModel } from '../models';
import { File } from '../../types';

// Types and global settings
import { JWTUser, AccessRoles } from '../../types';
import { status, FILE_STATUS } from '../libs/validate';

export class FilesController extends Controller {

	/**
	 * Uploads an image and returns a URL to the retrieve the image
	 */
	@POST({ path: '/uploadimage', do: [Auth.Personalize] })
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
			case UploadStatus.SUCCESS:
				return res.status(200).send(result.urls);
			case UploadStatus.ERROR_NO_FILE:
			case UploadStatus.ERROR_BAD_FILE:
				return res.status(400).send({ error: FILE_STATUS.ERROR_BAD_FILE });
			case UploadStatus.ERROR_BAD_UPLOAD_FOLDER:
				return res.status(400).send({ error: FILE_STATUS.ERROR_BAD_UPLOAD_FOLDER });
			case UploadStatus.ERROR_IMAGE_TOO_LARGE:
				return res.status(400).send({ error: FILE_STATUS.ERROR_BAD_UPLOAD_FOLDER });
			case UploadStatus.ERROR_WRITING:
				return res.status(400).send({ error: FILE_STATUS.ERROR_WRITING });
		}
	}

	@GET({ path: '/:filename', do: [] })
	public async getImage(req: Req, res: Res, next: Next) {
		const filename: string = req.params.filename;

		const file = await FileModel.findOne({ filename });
		if (!file) {
			return res.sendStatus(404);
		}

		res.writeHead(200, {
			'Content-Type': file.mimeType,
			'Content-Disposition': `attachment; filename=${file.filename}`,
			'Content-Length': file.data.length
		});
		res.end(file.data);
	}



	@GET({ path: '/', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.writer)] })
	public async getThumbnailUrls(req: Req, res: Res, next: Next) {
		const files: File[] = await FileModel.find({ thumbnail: true }, { filename: 1 }).lean();
		if (!files) {
			return res.status(404).send(status(FILE_STATUS.NO_FILES_FOUND));
		}
		res.send(files.map( file => Filestore.getFileURL({ uuid: file.filename })));
	}
}
