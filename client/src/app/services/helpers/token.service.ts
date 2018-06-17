import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TokenService {
	private readonly _isBrowser: boolean;

	public get token(): string {
		if (this._isBrowser) {
			return localStorage.getItem('token');
		}
		return '';
	}
	public set token(newToken: string) {
		if (this._isBrowser) {
			if (newToken) {
				localStorage.setItem('token', newToken);
				return;
			}
			localStorage.removeItem('token');
		}
	}

	constructor( @Inject(PLATFORM_ID) private platformId: Object) {
		this._isBrowser = isPlatformBrowser(platformId);
	}

}
