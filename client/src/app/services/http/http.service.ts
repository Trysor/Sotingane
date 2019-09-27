import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

import { MatIconRegistry } from '@angular/material/icon';

import { ServerService } from '@app/services/http/server.service';


@Injectable({ providedIn: 'root' })
export class HttpService {
	private readonly _urlBase: string;

	public get urlBase() { return this._urlBase; }
	public get client() { return this.httpClient; }

	constructor(
		@Optional() private serverService: ServerService,
		private httpClient: HttpClient,
		private iconRegistry: MatIconRegistry,
		private san: DomSanitizer) {

		this._urlBase = !!serverService
			? this.serverService.urlBase
			: `${document.location.protocol}//${document.location.hostname}`; // colon included in protocol

		// Registers the logo
		const logoPath = `${(!!serverService ? this._urlBase : '')}/assets/logo192themed.svg`;
		this.iconRegistry.addSvgIcon('logo', this.san.bypassSecurityTrustResourceUrl(logoPath));
	}
}
