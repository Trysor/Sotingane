import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '@env';
import { User, AccessRoles, CmsContent } from '@app/models';

import { Observable, Subscription, of } from 'rxjs';
import { map, catchError, timeout, takeUntil } from 'rxjs/operators';


@Injectable()
export class AdminService {

	constructor(private http: HttpClient, private router: Router) { }


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
