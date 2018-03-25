import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@env';
import { User, AccessRoles, CmsContent } from '@app/models';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, timeout, share, distinctUntilChanged, filter, debounceTime, takeUntil } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class HttpService {
	private _requests = new BehaviorSubject<number>(0);
	private _isLoading = new BehaviorSubject<boolean>(false);

	public get isLoading() {
		return this._isLoading;
	}

	private readonly _options = {
		reportProgress: true
	};


	constructor(private http: HttpClient) {

		this._requests.pipe(filter(x => 1 >= x), distinctUntilChanged(), debounceTime(20))
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
		return this.hookRequest(this.http.get<T>(url), until);
	}

	public post<T>(url: string, body: object) {
		return this.hookRequest(this.http.post<T>(url, body));
	}

	public patch<T>(url: string, body: object) {
		return this.hookRequest(this.http.patch<T>(url, body));
	}

	public delete<T>(url: string) {
		return this.hookRequest(this.http.delete<T>(url));
	}
}
