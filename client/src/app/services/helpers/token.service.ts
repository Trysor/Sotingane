import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { User } from '@app/models';

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

	constructor(@Inject(PLATFORM_ID) private platformId: Object) {
		this._isBrowser = isPlatformBrowser(platformId);
	}



	/**
	 * Decodes the provided JWT
	 * @param  {string} token the JWT to decode
	 * @return {User}         The decoded token user
	 */
	public jwtDecode(token: string): User {
		return token ? JSON.parse(this.b64decode(token.split('.')[1])) : null;
	}

	/**
	 * Returns the expiration date of a token
	 * @param  {string} token the token to get the expiration date of
	 * @return {Date}         the date the token expires
	 */
	public jwtExpirationDate(token: string): Date {
		const user = this.jwtDecode(token);
		if (!user || !user.hasOwnProperty('exp')) { return null; }

		const date = new Date(0);
		date.setUTCSeconds(user.exp);
		return date;
	}

	/**
	 * Returns true if the token has expired
	 * @param  {string}  token  the token to check the expiration date of
	 * @param  {number}  offset number of seconds offset from now
	 * @return {boolean}        whether the token has expired
	 */
	public jwtIsExpired(token: string, offset: number = 0): boolean {
		const date = this.jwtExpirationDate(token);
		// if we can't get a date, we assume its best to say that it has expired.
		if (null === date) { return true; }
		return ((new Date().valueOf() + offset * 1000) > date.valueOf());
	}


	/**
	 * Simulates the atob operator
	 * Credited: https://github.com/atk
	 * @param str
	 */
	private b64decode(str: string): string {
		/* tslint:disable:no-bitwise */
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		let output = '';

		str = String(str).replace(/=+$/, '');

		if (str.length % 4 === 1) { return null; }

		for (
			// initialize result and counters
			let bc = 0, bs: any, buffer: any, idx = 0;
			// get next character
			buffer = str.charAt(idx++);
			// character found in table? initialize bit storage and add its ascii value;
			~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
				// and if not first of each 4 characters,
				// convert the first 8 bits to one ascii character
				bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
		) {
			// try to find character in table (0-63, not found => -1)
			buffer = chars.indexOf(buffer);
		}
		/* tslint:enable:no-bitwise */
		return output;
	}
}
