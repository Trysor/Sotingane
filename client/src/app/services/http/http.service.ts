import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TransferState, StateKey, DomSanitizer } from '@angular/platform-browser';

import { MatIconRegistry } from '@app/modules/material.types';

import { env } from '@env';
import { ServerService } from '@app/services/http/server.service';
import { PlatformService } from '@app/services/utility/platform.service';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';



@Injectable({ providedIn: 'root' })
export class HttpService {
	private readonly _urlBase: string;

	public get urlBase() { return this._urlBase; }
	public get client() { return this.httpClient; }

	constructor(
		@Optional() private serverService: ServerService,
		private platform: PlatformService,
		private state: TransferState,
		private httpClient: HttpClient,
		private iconRegistry: MatIconRegistry,
		private san: DomSanitizer) {

		this._urlBase = platform.isServer
			? this.serverService.urlBase
			: `${document.location.protocol}//${document.location.hostname}`; // colon included in protocol

		// Registers the logo
		const logoPath = (platform.isServer ? this._urlBase : '') + '/assets/logo192themed.svg';
		iconRegistry.addSvgIcon('logo', san.bypassSecurityTrustResourceUrl(logoPath));
	}


	public apiUrl(api: string) { return env.API_BASE + api; } // API_BASE is overriden in server.service



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
		if (this.platform.isServer) { return request.pipe(tap(savestate => { this.state.set(key, savestate); })); }
		return request;
	}

}
