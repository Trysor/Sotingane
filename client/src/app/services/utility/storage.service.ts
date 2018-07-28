import { Injectable } from '@angular/core';

import { PlatformService } from '@app/services/utility/platform.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
	private readonly _serverMap: Map<string, string>;

	constructor(private platform: PlatformService) {
		this._serverMap = new Map();
	}

	// ---------------------------------------
	// --------------- SESSION ---------------
	// ---------------------------------------

	/**
	 * Sets a session storage item
	 * @param key
	 * @param value
	 */
	public setSession(key: string, value: string) {
		if (this.platform.isBrowser) {
			if (value) {
				sessionStorage.setItem(key, value);
				return;
			}
			sessionStorage.removeItem(key);
		} else {
			this._serverMap.set(key, value);
		}
	}

	/**
	 * Gets a session storage item
	 * @param key
	 */
	public getSession(key: string) {
		return this.platform.isBrowser ? sessionStorage.getItem(key) : this._serverMap.get(key);
	}

	// ---------------------------------------
	// ---------------- LOCAL ----------------
	// ---------------------------------------

	/**
	 * Sets a local storage item
	 * @param key
	 * @param value
	 */
	public setLocal(key: string, value: string) {
		if (this.platform.isBrowser) {
			if (value) {
				localStorage.setItem(key, value);
				return;
			}
			localStorage.removeItem(key);
		} else {
			this._serverMap.set(key, value);
		}
	}

	/**
	 * Gets a local storage item
	 * @param key
	 */
	public getLocal(key: string) {
		return this.platform.isBrowser ? localStorage.getItem(key) : this._serverMap.get(key);
	}
}
