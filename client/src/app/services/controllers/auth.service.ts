import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { env } from '@env';
import { User, UpdatePasswordUser, TokenResponse, AccessRoles, JWTUser } from '@types';

import { HttpService } from '@app/services/http/http.service';
import { PlatformService } from '@app/services/utility/platform.service';
import { SnackBarService } from '@app/services/utility/snackbar.service';

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

	constructor(
		private platform: PlatformService,
		private snackBar: SnackBarService,
		private http: HttpService,
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
	 * @param  {string}       token token to base the renewal timer on
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
			catchError(() => of(<TokenResponse>null)),
		).subscribe(res => {

			if (!res) {
				this.logOut({ expired: true, popup: true });
				return;
			}

			this._userSubject.next(res.user);
		});
	}




	/**
	 * Returns true if the user is of the given role
	 * @param  {AccessRoles}      role The role to compare against
	 * @return {boolean}          whether the user is of the given role
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
	 * @param  {User} user                   The user to log in
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
			this._userSubject.next(null);
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
			this.http.client.post<TokenResponse>(this.http.apiUrl(env.API.auth.token), null)
		);
	}

	/**
	 * Attempt to update the logged in user's password
	 * @param  {UpdatePasswordUser}  user the object containing the user data
	 */
	public updatePassword(user: UpdatePasswordUser) {
		return this.http.client.post<boolean>(this.http.apiUrl(env.API.auth.updatepass), user).pipe(
			map(() => true),
			catchError(() => of(false))
		); // returns message objects
	}
}
