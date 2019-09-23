import { get as configGet } from 'config';
import { UploadedFile } from 'express-fileupload';
import * as sharp from 'sharp';
import * as uuid from 'uuid/v5';

import { isProduction } from './routing';
import { FileModel } from '../models';
import { FileData, FileUploadStatus, FileUploadResult, JWTUser, FileURLPayload } from '../../types';


export class Filestore {
	public static readonly IMAGE_SIZES = [200, 800, 1024, 1920];
	public static readonly UUID_NAMESPACE_FILESTORE = configGet<string>('UUID_Namespace_Filestore');



	// ---------------------------------------
	// --------------- UTILITY ---------------
	// ---------------------------------------


	public static getURLsForAllSizes(uuidKey: string) {
		const payload = {
			urls: { default: Filestore.getFileURL(uuidKey, Filestore.IMAGE_SIZES[Filestore.IMAGE_SIZES.length - 1]) }
		} as FileURLPayload;

		Filestore.IMAGE_SIZES.forEach(size => {
			payload.urls[size] = Filestore.getFileURL(uuidKey, size);
		});

		return payload;
	}


	public static getFileURL(uuidKey: string, size: number) {
		const host = isProduction ? '' : `http://localhost:${configGet<string>('port')}`;
		return `${host}/api/files/download/${uuidKey}_${size}.webp`;
	}

	// ---------------------------------------
	// ------------ UPLOAD TO DB -------------
	// ---------------------------------------


	/**
	 * Upload image to the database. Returns a status, and if successful, a set of URLs
	 * pointing to the API-endpoints where the image can be found
	 */
	public static async uploadImageToDatabase(uploadedFile: UploadedFile, user: JWTUser): Promise<FileUploadResult> {
		// FILE ERRORS
		if (!uploadedFile) { return { status: FileUploadStatus.ERROR_NO_FILE }; }
		if (uploadedFile.truncated) { return { status: FileUploadStatus.ERROR_IMAGE_TOO_LARGE }; }

		// UUID
		const _uuid = uuid(uploadedFile.md5, Filestore.UUID_NAMESPACE_FILESTORE);

		// EXISTANCE CHECK
		const doesExist = await FileModel.exists({ uuid: _uuid });
		if (!doesExist) {
			const success = await Filestore.saveFileToDB(uploadedFile, _uuid, user);
			if (!success) { return { status: FileUploadStatus.ERROR_WRITING }; }
		}

		// CREATE RETURN OBJECT
		const payload = Filestore.getURLsForAllSizes(_uuid) as FileUploadResult;
		payload.status = FileUploadStatus.SUCCESS;

		return payload;
	}

	// ---------------------------------------
	// -------------- SAVE FILE --------------
	// ---------------------------------------


	/**
	 * Save images to the database. Helper. Returns true if successful. False otherwise.
	 */
	private static async saveFileToDB(uploadedFile: UploadedFile, uuidKey: string, user: JWTUser) {
		// Transform data and save as files
		const bufferArray: Promise<Buffer>[] = [];
		try {
			// Get sharp instance
			const sharpInstance = sharp(uploadedFile.data);
			// bufferArray.push(sharpInstance.clone().toBuffer()); // unchanged

			// Create an array of buffers
			Filestore.IMAGE_SIZES.forEach(size => {
				bufferArray.push(sharpInstance.clone().resize(size).webp().toBuffer());
			});

			// Await all image transformations all at the same time
			const imagesAsBuffer = await Promise.all(bufferArray);

			const dataObj = new Map<string, Buffer>();
			Filestore.IMAGE_SIZES.forEach((size, index) => {
				dataObj.set(size.toString(), imagesAsBuffer[index]);
			});

			const title = uploadedFile.name
				.substring(0, uploadedFile.name.lastIndexOf('.')) // do not include extension
				.substring(0, 50); // and limit to 50 characters total.

			const file = new FileModel({
				data: dataObj,
				title,
				uploadedBy: user._id,
				mimeType: 'image/webp',
				hash: uploadedFile.md5,
				uuid: uuidKey
			} as FileData);

			// Save file
			await file.save();
			return true;
		} catch (e) {
			return false;
		}
	}
}
