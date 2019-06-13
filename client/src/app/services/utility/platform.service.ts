import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { TransferState, StateKey } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class PlatformService {
	private readonly _isBrowser: boolean;
	private readonly _isServer: boolean;
	private readonly _document: Document;

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		@Inject(DOCUMENT) private doc: Document,
		private state: TransferState) {

		this._isBrowser = isPlatformBrowser(this.platformId);
		this._isServer = isPlatformServer(this.platformId);
		this._document = this.doc;
	}

	public get isBrowser() { return this._isBrowser; }

	public get isServer() { return this._isServer; }

	public get document() { return this._document; }


	/**
	 * Platform dependent state handler used to transfer state between server and a client.
	 * Stores a value if on the server, and if on a client it will consume it
	 * @param value On SERVER: the value to store. OTHERWISE: fallback value or value to use after state was consumed
	 */
	public handleState<T>(key: StateKey<T>, value: T) {
		if (this._isServer) {
			this.state.set(key, value);
			return value;
		}

		const state = this.state.get<T>(key, null);
		if (this.state.hasKey(key) && state) {
			this.state.remove(key); // If state exists, remove it
		}
		return state || value;
	}
}
