import { Injectable, Optional, Inject, PLATFORM_ID, } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { isPlatformServer } from '@angular/common';

import { environment } from '@env';
import { User, AccessRoles, CmsContent } from '@app/models';

import { ServerService } from '@app/services/helpers/server.service';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, timeout, share, distinctUntilChanged, filter, debounceTime, takeUntil } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class HttpService {
	private _requests = new BehaviorSubject<number>(0);
	private _isLoading = new BehaviorSubject<boolean>(false);

	private readonly _options = { reportProgress: true };
	private readonly _apiRoute: string;

	public get isLoading() { return this._isLoading; }

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Optional() private serverService: ServerService,
		private http: HttpClient) {

		this._apiRoute = isPlatformServer(platformId) ? serverService.apiBase : '';

		this._requests.pipe(filter(x => 1 >= x), distinctUntilChanged(), debounceTime(50))
			.subscribe(subs => this._isLoading.next(subs > 0));
	}

	/**
	 * Hooks onto
	 * @param obs
	 */
	private hookRequest<T>(obs: Observable<T>, until?: Observable<any>) {
		// Up counter by 1
		this._requests.next(this._requests.getValue() + 1);
		// Share and set timeout
		let piped = obs.pipe(share(), timeout(environment.TIMEOUT));
		if (until) { piped = piped.pipe(takeUntil(until)); }

		const done = () => this._requests.next(this._requests.getValue() - 1);
		piped.subscribe(done, done);
		return piped;
	}


	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	public get<T>(url: string, until?: Observable<any>) {
		return this.hookRequest(this.http.get<T>(this._apiRoute + url), until);
	}

	public post<T>(url: string, body: object) {
		return this.hookRequest(this.http.post<T>(this._apiRoute + url, body));
	}

	public patch<T>(url: string, body: object) {
		return this.hookRequest(this.http.patch<T>(this._apiRoute + url, body));
	}

	public delete<T>(url: string) {
		return this.hookRequest(this.http.delete<T>(this._apiRoute + url));
	}
}
