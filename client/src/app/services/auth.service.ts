import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { isPlatformBrowser, isPlatformServer } from '@angular/common';

import { MatSnackBar } from '@angular/material';

import { environment } from '@env';
import { User, UpdatePasswordUser, UserToken, AccessRoles } from '@app/models';
import { TokenService } from '@app/services/token.service';

import { Observable, Subscription, BehaviorSubject, timer, of } from 'rxjs';
import { map, catchError, timeout, takeUntil } from 'rxjs/operators';


@Injectable()
export class AuthService {
	private _userSubject = new BehaviorSubject(null);
	private _renewalSub: Subscription;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		private tokenService: TokenService,
		private snackBar: MatSnackBar,
		private http: HttpClient,
		private router: Router) {

		// If we're on the server, push null
		// TODO: inject serverService, figure out how to get user from API
		if (isPlatformServer(platformId)) {
			this._userSubject.next(null);
			return;
		}

		// Browser: Get the token from the tokenService, update user data accordingly.
		const token = tokenService.token;
		if (!token || this.jwtIsExpired(token)) {
			tokenService.token = null;
			return;
		}
		this.updateCurrentUserData(token);

		// Only start the renewToken timer in browser.
		if (isPlatformBrowser(platformId)) { this.engageRenewTokenTimer(token); }
	}

	/**
	 * Updates the user data field by decoding the JWT token
	 * @param  {string} token the JWT token to decode
	 */
	private updateCurrentUserData(token: string) {
		if (!token) { return; }
		const u = this.jwtDecode(token);
		if (!u) { return; }
		this._userSubject.next(u);
	}

	/**
	 * Decodes the provided JWT
	 * @param  {string} token the JWT to decode
	 * @return {User}         The decoded token user
	 */
	private jwtDecode(token: string): User {
		return token ? JSON.parse(atob(token.split('.')[1])) : null;
	}

	/**
	 * Returns the expiration date of a token
	 * @param  {string} token the token to get the expiration date of
	 * @return {Date}         the date the token expires
	 */
	private jwtExpirationDate(token: string): Date {
		const user = this.jwtDecode(token);
		if (!user || !user.hasOwnProperty('exp')) { return null; }

		const date = new Date(0);
		date.setUTCSeconds(user.exp);
		return date;
	}

	/**
	 * Starts a timer to renew the jwt before it exires
	 * @param  {string}       token token to base the renewal timer on
	 */
	private engageRenewTokenTimer(token: string) {
		// cancel any ongoing timers
		if (this._renewalSub) { this._renewalSub.unsubscribe(); }
		// Log out the user if it is too late to renew.
		if (this.jwtIsExpired(token)) { this.logOut(); return; }
		// Engage a new timer to go off 20 minutes before expiration token
		const renewalDate = new Date(this.jwtExpirationDate(token).getTime() - 1000 * 60 * 20);
		this._renewalSub = timer(renewalDate).subscribe(time => {
			const sub = this.renewToken().subscribe(userToken => {
				sub.unsubscribe();
				if (userToken.token) {
					this.engageRenewTokenTimer(userToken.token);
					return;
				}
				this.openSnackBar('Session expired', '');
				this.logOut();
			});
		});
	}

	/**
	 * Opens a snackbar with the given message and action message
	 * @param  {string} message The message that is to be displayed
	 * @param  {string} action  the action message that is to be displayed
	 */
	private openSnackBar(message: string, action: string) {
		this.snackBar.open(message, action, {
			duration: 5000,
		});
	}

	/**
	 * Gets the user as an observable
	 * @return {BehaviorSubject<User>}    the user Subject
	 */
	public getUser(): BehaviorSubject<User> {
		return this._userSubject;
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
	 * Returns true if the user is of the given role
	 * @param  {AccessRoles}      role The role to compare against
	 * @return {boolean}          whether the user is of the given role
	 */
	public isUserOfRole(role: AccessRoles): boolean {
		const user = this.getUser().getValue();
		return user && user.role === role;
	}

	/**
	 * Log out current user
	 */
	public logOut() {
		this.tokenService.token = null;
		if (this._renewalSub) { this._renewalSub.unsubscribe(); }
		this._userSubject.next(null);
		this.router.navigateByUrl('/');
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
	 * @return {Observable<boolean>}         Server's response, as an Observable
	 */
	public login(user: User): Observable<boolean> {
		return this.http.post<UserToken>(environment.URL.auth.login, user).pipe(
			map(userToken => {
				// Set token
				this.tokenService.token = userToken.token;
				// Engage token renewal timer
				this.engageRenewTokenTimer(userToken.token);
				// Set user data & Notify subscribers
				this.updateCurrentUserData(userToken.token);
				return !!userToken.token;
			}),
			timeout(environment.TIMEOUT)
		);
	}

	/**
	 * Attempt to renew JWT token
	 * @return {Observable<boolean>} wether the JWT was successfully renewed
	 */
	public renewToken(): Observable<UserToken> {
		return this.http.get<UserToken>(environment.URL.auth.token).pipe(
			map(userToken => {
				this.tokenService.token = userToken.token;    // Set token
				return userToken;
			}),
			timeout(environment.TIMEOUT)
		);
	}

	/**
	 * Attempt to update the logged in user's password
	 * @param  {UpdatePasswordUser}  user the object containing the user data
	 * @return {Observable<boolean>}      wether the password was successfully updated
	 */
	public updatePassword(user: UpdatePasswordUser): Observable<boolean> {
		return this.http.post<boolean>(environment.URL.auth.updatepass, user).pipe(
			map(() => true),
			timeout(environment.TIMEOUT),
			catchError(err => of(false))
		); // returns message objects
	}
}
