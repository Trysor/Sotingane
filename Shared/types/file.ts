import { User } from './user';
export interface FileData {
	data: Map<string, Buffer> | FileDataObject; // Map when inputting into the DB, FileDataObject when aquiring it.
	title: string;
	uploadedBy: User;
	uploadedDate?: Date;
	uuid: string;
	hash: string;
	mimeType: string;
}

export interface FileDataObject {
	[key: string]: {
		_bsonType: string;
		sub_type: number;
		position: number;
		buffer: Buffer;
	};
}


export interface FileThumbnail {
	thumbnail: string;
	uuid: string;
	uploadedBy: User;
	uploadedDate: Date;
	title: string;
}

export interface FileURLPayload {
	urls: {
		default: string;
		[key: string]: string;
	};
}

export enum FileUploadStatus {
	SUCCESS,
	ERROR_BAD_UPLOAD_FOLDER,
	ERROR_NO_FILE,
	ERROR_BAD_FILE,
	ERROR_IMAGE_TOO_LARGE,
	ERROR_WRITING
}

export interface FileUploadResult extends Partial<FileURLPayload> {
	status: FileUploadStatus;
}

