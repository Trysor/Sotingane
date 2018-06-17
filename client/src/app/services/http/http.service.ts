import { Injectable, Optional, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TransferState, StateKey } from '@angular/platform-browser';
import { isPlatformServer, DOCUMENT } from '@angular/common';

import { env } from '@env';
import { ServerService } from '@app/services/helpers/server.service';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class HttpService {
	private readonly _isServer: boolean;
	private readonly _urlBase: string;

	public get urlBase() { return this._urlBase; }
	public get client() { return this.httpClient; }

	constructor(
		@Inject(DOCUMENT) private document: Document,
		@Inject(PLATFORM_ID) private platformId: Object,
		@Optional() private serverService: ServerService,
		private state: TransferState,
		private httpClient: HttpClient) {

		this._isServer = isPlatformServer(platformId);

		this._urlBase = this._isServer
			? this.serverService.urlBase
			: `${document.location.protocol}//${document.location.hostname}`; // colon included in protocol
	}


	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	/**
	 * Handle request on server and transfer state to client
	 * @param key
	 * @param request
	 */
	public fromState<T>(key: StateKey<T>, request: Observable<T>): Observable<T> {
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
