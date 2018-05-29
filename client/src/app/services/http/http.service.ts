import { Injectable, Optional, Inject, PLATFORM_ID, } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { isPlatformServer, DOCUMENT } from '@angular/common';

import { environment } from '@env';
import { User, AccessRoles, CmsContent } from '@app/models';

import { ServerService } from '@app/services/helpers/server.service';

import { TransferState, StateKey } from '@angular/platform-browser';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, timeout, share, distinctUntilChanged, filter, debounceTime, takeUntil, tap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class HttpService {
	private _requests = new BehaviorSubject<number>(0);
	private _isLoading = new BehaviorSubject<boolean>(false);

	private readonly _options = { reportProgress: true };
	private readonly _isServer: boolean;
	private readonly _docURL: string;


	public get apiBase() { return this._isServer ? this.serverService.apiBase : ''; }
	public get urlBase() { return this._isServer ? this.serverService.urlBase : this._docURL; }
	public get isLoading() { return this._isLoading; }

	constructor(
		@Inject(DOCUMENT) private document: Document,
		@Inject(PLATFORM_ID) private platformId: Object,
		@Optional() private serverService: ServerService,
		private state: TransferState,
		private http: HttpClient) {

		this._isServer = isPlatformServer(platformId);
		if (!this._isServer) {
			// colon included in protocol
			this._docURL = `${document.location.protocol}//${document.location.hostname}`;
		}

		this._requests.pipe(filter(x => 1 >= x), distinctUntilChanged(), debounceTime(50))
			.subscribe(subs => this._isLoading.next(subs > 0));
	}

	/**
	 * Hooks onto any API request
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
		return this.hookRequest(this.http.get<T>(this.apiBase + url), until);
	}

	public post<T>(url: string, body: object) {
		return this.hookRequest(this.http.post<T>(this.apiBase + url, body));
	}

	public patch<T>(url: string, body: object) {
		return this.hookRequest(this.http.patch<T>(this.apiBase + url, body));
	}

	public delete<T>(url: string) {
		return this.hookRequest(this.http.delete<T>(this.apiBase + url));
	}

	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	/**
	 * Handle request on server and transfer state to client
	 * @param key
	 * @param request
	 */
	public transferStateForRequest<T>(key: StateKey<T>, request: Observable<T>): Observable<T> {
		// Get state
		const state = this.state.get<T>(key, null);
		// If state exists, remove it and deliver its content
		if (this.state.hasKey(key) && state) {
			this.state.remove(key);
			return of<T>(state);
		}
		// Else request from API. If the request occurs on the server, save the state to the state store
		if (this._isServer) { return request.pipe(tap(savestate => { this.state.set(key, savestate); })); }
		return request;
	}

}
