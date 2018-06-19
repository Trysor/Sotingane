import { Injectable } from '@angular/core';

import { HttpService } from '@app/services/http/http.service';

import { env } from '@env';
import { User, CmsContent } from '@app/models';

import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AdminService {

	constructor(private http: HttpService) { }


	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	public getAllusers(): Observable<User[]> {
		return this.http.client.get<User[]>(env.API_BASE + env.API.admin.users);
	}


	public patchUser(user: User): Observable<boolean> {
		return this.http.client.patch<boolean>(env.API_BASE + env.API.admin.users + '/' + user._id, user);
	}


	public getAllContent(): Observable<CmsContent[]> {
		return this.http.client.get<CmsContent[]>(env.API_BASE + env.API.admin.cms);
	}

	public getContentPage(contentUrl: string): Observable<CmsContent> {
		return this.http.client.get<CmsContent>(env.API_BASE + env.API.admin.cms + '/' + contentUrl);
	}
}
