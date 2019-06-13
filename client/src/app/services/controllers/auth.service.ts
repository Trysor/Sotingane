import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { makeStateKey } from '@angular/platform-browser';
const TOKEN_TIMESTAMP_KEY = makeStateKey<Date>('tokenTimestamp');

import { env } from '@env';
import { User, UpdatePasswordUser, TokenResponse, AccessRoles, JWTUser } from '@types';

import { HttpService } from '@app/services/http/http.service';
import { PlatformService } from '@app/services/utility/platform.service';
import { SnackBarService } from '@app/services/utility/snackbar.service';
import { TokenService } from '@app/services/utility/token.service';

import { BehaviorSubject, of } from 'rxjs';
import { map, catchError, finalize, take } from 'rxjs/operators';



@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly _userSubject = new BehaviorSubject<JWTUser>(null);

	public get user() { return this._userSubject; }

	public get hasToken() { return !!this.tokens.token; }

	constructor(
		private platform: PlatformService,
		private snackBar: SnackBarService,
		private http: HttpService,
		private tokens: TokenService,
		private router: Router) {


	}

	// ---------------------------------------
	// ------------ HELPER METHODS -----------
	// ---------------------------------------

	private setTokensAndUserObject(res: TokenResponse) {
		this.tokens.token = res && res.token || null;
		this.tokens.refreshToken = res && res.refreshToken || null;
		this._userSubject.next(res && res.user || null);
	}



	/**
	 * Returns true if the user is of the given role
	 */
	public isUserOfRole(role: AccessRoles): boolean {
		const user = this.user.getValue();
		return user && user.roles.includes(role);
	}


	/**
	 * compares the two users and returns true if they are one and the same
	 * @param a		User
	 * @param b		User
	 */
	public isSameUser(a: User, b: User) {
		if (a._id && b._id) {
			return a._id === b._id;
		}
		return a.username === b.username;
	}

	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	/**
	 * Requests to log the user in
	 */
	public login(user: User) {
		return this.http.client.post<TokenResponse>(env.API.auth.login, user).pipe(map(
			(res) => {
				if (!res) { return false; }
				this.setTokensAndUserObject(res);
				return true;
			}
		));
	}

	/**
	 * Log out current user
	 */
	public logOut(opts?: { expired: boolean, popup: boolean }) {
		// TODO: redo this

		if (this._userSubject.getValue() === null) { return; }

		if (opts && opts.popup) { this.snackBar.open('Session expired'); }

		const _finalize = () => {
			this.setTokensAndUserObject(null);
			this.router.navigateByUrl('/');
		};

		if (opts && opts.expired) {
			_finalize();
			return;
		}

		// If this post errors out (401), then the API already deems you as an unauthorized user
		return this.http.client.post(env.API.auth.logout, null).pipe(finalize(_finalize)).subscribe();
	}

	/**
	 * Attempt to renew JWT token
	 */
	public renewToken() {
		const timestamp = this.platform.handleState(TOKEN_TIMESTAMP_KEY, Date.now());
		return this.http.client.get<TokenResponse>(`${env.API.auth.token}?ts=${timestamp}`).pipe(
			take(1),
			catchError(() => of(null as TokenResponse)),
		).subscribe(res => {
			if (!res) {
				this.logOut({ expired: this.hasToken, popup: this.hasToken });
				return;
			}

			this.setTokensAndUserObject(res);
		});
	}

	/**
	 * Attempt to update the logged in user's password
	 */
	public updatePassword(user: UpdatePasswordUser) {
		return this.http.client.post<boolean>(env.API.auth.updatepass, user).pipe(
			map(() => true),
			catchError(() => of(false))
		); // returns message objects
	}
}
