import { Injectable } from '@angular/core';

import { HttpService } from '@app/services/http/http.service';

import { environment } from '@env';
import { User, CmsContent } from '@app/models';

import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class AdminService {

	constructor(private http: HttpService) { }


	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	public getAllusers(): Observable<User[]> {
		return this.http.get<User[]>(environment.URL.admin.users).pipe(timeout(environment.TIMEOUT));
	}


	public patchUser(user: User): Observable<boolean> {
		return this.http.patch<boolean>(environment.URL.admin.users + '/' + user._id, user).pipe(timeout(environment.TIMEOUT));
	}


	public getAllContent(): Observable<CmsContent[]> {
		return this.http.get<CmsContent[]>(environment.URL.admin.cms).pipe(timeout(environment.TIMEOUT));
	}
}
