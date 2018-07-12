import { Injectable, Optional, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TransferState, StateKey, DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

import { env } from '@env';
import { ServerService } from '@app/services/http/server.service';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';



@Injectable({ providedIn: 'root' })
export class HttpService {
	private readonly _isServer: boolean;
	private readonly _apiBase: string;
	private readonly _urlBase: string;

	public get urlBase() { return this._urlBase; }
	public get client() { return this.httpClient; }

	constructor(
		@Inject(DOCUMENT) private document: Document,
		@Inject(PLATFORM_ID) private platformId: Object,
		@Optional() private serverService: ServerService,
		private state: TransferState,
		private httpClient: HttpClient,
		private iconRegistry: MatIconRegistry,
		private san: DomSanitizer) {

		this._isServer = isPlatformServer(platformId);

		this._urlBase = this._isServer
			? this.serverService.urlBase
			: `${document.location.protocol}//${document.location.hostname}`; // colon included in protocol

		this._apiBase = this._isServer
			? this.serverService.urlBase
			: env.API_BASE;

		// Registers the logo
		const logoPath = (this._isServer ? this._urlBase : '') + '/assets/logo192themed.svg';
		iconRegistry.addSvgIcon('logo', san.bypassSecurityTrustResourceUrl(logoPath));
	}


	public apiUrl(api: string) { return this._apiBase + api; }



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
