import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PlatformService {
	private readonly _isBrowser: boolean;
	private readonly _isServer: boolean;
	private readonly _document: Document;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Inject(DOCUMENT) private doc: Document) {
		this._isBrowser = isPlatformBrowser(platformId);
		this._isServer = isPlatformServer(platformId);
		this._document = doc;
	}

	public get isBrowser() { return this._isBrowser; }

	public get isServer() { return this._isServer; }

	public get document() { return this._document; }
}
