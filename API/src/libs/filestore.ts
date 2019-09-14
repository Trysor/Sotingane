import { readdir } from 'fs';
import { promisify } from 'util';
import { get as configGet } from 'config';
import { format as pathFormat } from 'path';
import { UploadedFile } from 'express-fileupload';
import * as sharp from 'sharp';
import * as uuid from 'uuid/v5';

import { isProduction } from './routing';
import { FileModel, FileDoc } from '../models';
import { File } from '../../types';
import { JWTUser } from '../../../Shared/types';

const readdirAsync = promisify(readdir);



export class Filestore {
	public static readonly IMAGE_SIZES = [200, 800, 1024, 1920];
	public static readonly UUID_NAMESPACE_FILESTORE = configGet<string>('UUID_Namespace_Filestore');


	public static getFileURL(settings: UploadSettings, size = 0) {
		const host = isProduction ? '' : `http://localhost:${configGet<string>('port')}`;
		return size === 0
			? `${host}/api/files/${settings.uuid}${settings.extension || ''}`
			: `${host}/api/files/${settings.uuid}_${size}${settings.extension || ''}`;
	}


	// ---------------------------------------
	// ------------ UPLOAD IMAGE -------------
	// ---------------------------------------

	/**
	 * Upload image to the filesystem. Returns a status, and if successful, a set of browser-relative
	 * paths to where the image assets can be accessed
	 */
	public static async uploadImage(uploadedFile: UploadedFile, origin: string): Promise<UploadResult> {
		// FOLDER CHECK
		let folderPath: string;
		let folderContent: string[];
		try {
			folderPath = configGet<string>('imageUploadPath');
			folderContent = await readdirAsync(folderPath); // Find folder
		} catch { }
		if (!folderContent) {
			return { status: UploadStatus.ERROR_BAD_UPLOAD_FOLDER };
		}

		// FILE ERRORS
		if (!uploadedFile) { return { status: UploadStatus.ERROR_NO_FILE }; }
		if (uploadedFile.truncated) { return { status: UploadStatus.ERROR_IMAGE_TOO_LARGE }; }


		// UUID
		const _uuid = uuid(uploadedFile.md5, Filestore.UUID_NAMESPACE_FILESTORE);
		const extension = Filestore.getFileExtension(uploadedFile.name);

		// UPLOAD CHECK
		const requiresUpload = !folderContent.includes(pathFormat({ name: _uuid, ext: extension }));
		if (requiresUpload) {
			const success = await Filestore.saveFileToFilesystem(uploadedFile, {
				uuid: _uuid,
				folderPath,
				extension
			});
			if (!success) { return { status: UploadStatus.ERROR_WRITING }; }
		}

		// CREATE RETURN OBJECT
		const returnURLBase = `${origin}/${configGet<string>('browserRelativeUploadPath')}`;
		const uploadResult = {
			status: UploadStatus.SUCCESS,
			urls: {
				default: `${returnURLBase}/${_uuid}${extension}`
			}
		} as UploadResult;

		Filestore.IMAGE_SIZES.forEach(size => {
			uploadResult.urls[size] = `${returnURLBase}/${_uuid}_${size}${extension}`;
		});

		return uploadResult;
	}

	/**
	 * Upload image to the database. Returns a status, and if successful, a set of URLs
	 * pointing to the API-endpoints where the image can be found
	 */
	public static async uploadImageToDatabase(uploadedFile: UploadedFile, user: JWTUser): Promise<UploadResult> {
		// FILE ERRORS
		if (!uploadedFile) { return { status: UploadStatus.ERROR_NO_FILE }; }
		if (uploadedFile.truncated) { return { status: UploadStatus.ERROR_IMAGE_TOO_LARGE }; }

		// UUID
		const _uuid = uuid(uploadedFile.md5, Filestore.UUID_NAMESPACE_FILESTORE);
		const extension = Filestore.getFileExtension(uploadedFile.name);

		// EXISTANCE CHECK
		const doesExist = await FileModel.findOne({ hash: uploadedFile.md5 }).lean();
		if (!doesExist) {
			const success = await Filestore.saveFileToDB(uploadedFile, {
				uuid: _uuid,
				extension
			}, user);
			if (!success) { return { status: UploadStatus.ERROR_WRITING }; }
		}

		// CREATE RETURN OBJECT
		const uploadResult = {
			status: UploadStatus.SUCCESS,
			urls: { default: Filestore.getFileURL({ uuid: _uuid, extension }) }
		} as UploadResult;

		Filestore.IMAGE_SIZES.forEach(size => {
			uploadResult.urls[size] = Filestore.getFileURL({ uuid: _uuid, extension }, size);
		});

		return uploadResult;
	}

	// ---------------------------------------
	// -------------- SAVE FILE --------------
	// ---------------------------------------

	/**
	 * Save images to the filesystem. Helper. Returns true if successful. False otherwise.
	 */
	private static async saveFileToFilesystem(uploadedFile: UploadedFile, settings: UploadSettings) {
		// Transform data and save as files
		const dataResult: Map<number, Promise<sharp.OutputInfo>> = new Map();
		try {
			const sharpInstance = sharp(uploadedFile.data);
			dataResult.set(0, sharpInstance.clone().toFile(Filestore.getFilename(settings))); // unchanged

			Filestore.IMAGE_SIZES.forEach(size => {
				dataResult.set(size, sharpInstance.clone().resize(size).toFile(Filestore.getFilename(settings)));
			});

			await Promise.all(dataResult.values());
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Save images to the database. Helper. Returns true if successful. False otherwise.
	 */
	private static async saveFileToDB(uploadedFile: UploadedFile, settings: UploadSettings, user: JWTUser) {
		// Transform data and save as files
		const bufferArray: Promise<Buffer>[] = [];
		try {
			// Get sharp instance
			const sharpInstance = sharp(uploadedFile.data);
			bufferArray.push(sharpInstance.clone().toBuffer()); // unchanged

			// Create an array of buffers
			Filestore.IMAGE_SIZES.forEach(size => {
				bufferArray.push(sharpInstance.clone().resize(size).toBuffer());
			});

			// Await all image transformations all at the same time
			const imagesAsBuffer = await Promise.all(bufferArray);

			// Create a list of documents we want to save
			const filesToSave: FileDoc[] = [];
			imagesAsBuffer.forEach((buffer, index) => {
				const fileName = pathFormat({
					name: (index === 0)
						? settings.uuid
						: `${settings.uuid}_${Filestore.IMAGE_SIZES[index - 1]}`,
					ext: settings.extension
				});

				filesToSave.push(new FileModel({
					data: buffer,
					filename: fileName,
					uploadedBy: user._id,
					mimeType: uploadedFile.mimetype,
					hash: uploadedFile.md5,
					thumbnail: (index === 1) // smallest size of the array
				} as File));

			});

			// Save all files at the same time
			await Promise.all(filesToSave.map(file => file.save()));
			return true;
		} catch (e) {
			return false;
		}
	}

	// ---------------------------------------
	// --------------- HELPERS ---------------
	// ---------------------------------------

	private static getFileExtension(filename: string) {
		const splits = filename.split('.');
		return splits.length === 0 ? '' : `.${splits[splits.length - 1]}`;
	}


	private static getFilename(settings: UploadSettings, size = 0) {
		return pathFormat({
			dir: settings.folderPath,
			name: (size === 0)
				? settings.uuid
				: `${settings.uuid}_${size}`,
			ext: settings.extension
		});
	}
}

export enum UploadStatus {
	SUCCESS,
	ERROR_BAD_UPLOAD_FOLDER,
	ERROR_NO_FILE,
	ERROR_BAD_FILE,
	ERROR_IMAGE_TOO_LARGE,
	ERROR_WRITING
}

export interface UploadResult {
	status: UploadStatus;
	urls?: {
		default: string;
		[key: string]: string;
	};
}

interface UploadSettings {
	uuid: string;
	folderPath?: string;
	extension?: string;
}
