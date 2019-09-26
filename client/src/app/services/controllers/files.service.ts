import { Injectable } from '@angular/core';

import { env } from '@env';

import { HttpService } from '@app/services/http/http.service';

import { FileData, FileThumbnail, FileURLPayload, FileUploadResult } from '@types';

@Injectable({ providedIn: 'root' })
export class FilesService {

	constructor(private http: HttpService) { }


	/**
	 * Requests a file upload of a given file
	 */
	public uploadImage(file: File) {
		if (!file) { return null; }

		// TODO: check for filetype before proceeding

		const formData = new FormData();
		formData.append('file', file, file.name);

		return this.http.client.post<FileUploadResult>(
			env.API.files,
			formData,
			{
				reportProgress: true,
				observe: 'events'
			}
		);
	}


	/**
	 * Requests the smallest images' urls
	 */
	public getThumbnails() {
		return this.http.client.get<FileThumbnail[]>(env.API.files);
	}

	/**
	 * Requests all URL data for the given UUID
	 */
	public getFileURLs(uuid: string) {
		return this.http.client.get<FileURLPayload>(`${env.API.files}/${uuid}`);
	}


	/**
	 * Request to delete the file of a given uuid
	 */
	public deleteFile(uuid: string) {
		return this.http.client.delete<boolean>(`${env.API.files}/${uuid}`);
	}


	/**
	 * Request to delete the file of a given uuid
	 */
	public updateFile(uuid: string, data: FileData) {
		return this.http.client.patch<boolean>(`${env.API.files}/${uuid}`, data);
	}
}
