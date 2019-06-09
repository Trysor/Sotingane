import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { env } from '@env';
import { User, UpdatePasswordUser, TokenResponse, AccessRoles, JWTUser } from '@types';

import { HttpService } from '@app/services/http/http.service';
import { PlatformService } from '@app/services/utility/platform.service';
import { SnackBarService } from '@app/services/utility/snackbar.service';
import { TokenService } from '@app/services/utility/token.service';

import { makeStateKey } from '@angular/platform-browser';
const USERTOKEN_KEY = makeStateKey<TokenResponse>('userToken');

import { Subscription, BehaviorSubject, timer, of } from 'rxjs';
import { map, catchError, finalize, take } from 'rxjs/operators';



@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly _userSubject = new BehaviorSubject<JWTUser>(null);
	private _renewalSub: Subscription;

	public get user() {
		return this._userSubject;
	}

	public get hasToken() {
		return !!this.tokens.token;
	}

	constructor(
		private platform: PlatformService,
		private snackBar: SnackBarService,
		private http: HttpService,
		private tokens: TokenService,
		private router: Router) {

		if (this.platform.isBrowser) {
			this._userSubject.subscribe(user => this.engageRenewTokenTimer(user));
		}

		this.updateTokenInfo();
	}


	// ---------------------------------------
	// ------------ USER METHODS -------------
	// ---------------------------------------

	/**
	 * Starts a timer to renew the jwt before it exires
	 */
	private engageRenewTokenTimer(user: JWTUser) {
		// cancel any ongoing timers
		if (this._renewalSub) { this._renewalSub.unsubscribe(); }
		if (!user) { return; }

		// Start new timer
		const newTime = Math.max(user.exp * 1000 - Date.now(), 0);

		// Update the token(s) and re-engage timer on complete
		this._renewalSub = timer(newTime).pipe(take(1)).subscribe(() => this.updateTokenInfo());
	}


	// ---------------------------------------
	// ----------- HELPER METHODS ------------
	// ---------------------------------------

	private updateTokenInfo() {
		return this.renewToken().pipe(
			take(1),
			catchError(() => of(null as TokenResponse)),
		).subscribe(res => {
			if (!res) {
				this.logOut({ expired: this.hasToken, popup: true });
				return;
			}

			this.setTokensAndUserObject(res);
		});
	}

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
		return this.http.client.post<TokenResponse>(this.http.apiUrl(env.API.auth.login), user).pipe(map(
			(res) => {
				if (!res) { return false; }
				this._userSubject.next(res.user);
				return true;
			}
		));
	}

	/**
	 * Log out current user
	 */
	public logOut(opts?: { expired: boolean, popup: boolean }) {

		// TODO: redo this
		if (opts && opts.popup) { this.snackBar.open('Session expired'); }

		if (this._userSubject.getValue() === null) { return; }

		const _finalize = () => {
			this.setTokensAndUserObject(null);
			this.router.navigateByUrl('/');
		};

		if (opts && opts.expired) {
			_finalize();
			return;
		}

		// If this post errors out (401), then the API already deems you as an unauthorized user
		return this.http.client.post(this.http.apiUrl(env.API.auth.logout), null).pipe(finalize(_finalize)).subscribe();
	}

	/**
	 * Attempt to renew JWT token
	 */
	private renewToken() {
		return this.http.fromState(
			USERTOKEN_KEY,
			this.http.client.get<TokenResponse>(this.http.apiUrl(env.API.auth.token) + '?ts=' + Date.now())
		);
	}

	/**
	 * Attempt to update the logged in user's password
	 */
	public updatePassword(user: UpdatePasswordUser) {
		return this.http.client.post<boolean>(this.http.apiUrl(env.API.auth.updatepass), user).pipe(
			map(() => true),
			catchError(() => of(false))
		); // returns message objects
	}
}
