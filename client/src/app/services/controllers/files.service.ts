import { Injectable } from '@angular/core';

import { env } from '@env';

import { HttpService } from '@app/services/http/http.service';

import { BehaviorSubject, of, combineLatest } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

		return this.http.client.post<File>(
			env.API.files.uploadimage,
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
		return this.http.client.get<string[]>(env.API.files.getThumbnails);
	}
}
