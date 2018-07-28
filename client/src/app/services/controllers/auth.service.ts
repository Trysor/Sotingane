import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material';

import { env } from '@env';
import { User, UpdatePasswordUser, UserToken, AccessRoles } from '@app/models';

import { HttpService } from '@app/services/http/http.service';
import { TokenService } from '@app/services/utility/token.service';
import { PlatformService } from '@app/services/utility/platform.service';


import { Observable, Subscription, BehaviorSubject, timer, of } from 'rxjs';
import { map, catchError, takeUntil, finalize } from 'rxjs/operators';



@Injectable({ providedIn: 'root' })
export class AuthService {
	private _userSubject = new BehaviorSubject(null);
	private _renewalSub: Subscription;

	public get user(): BehaviorSubject<User> {
		return this._userSubject;
	}

	constructor(
		private platform: PlatformService,
		private tokenService: TokenService,
		private snackBar: MatSnackBar,
		private http: HttpService,
		private router: Router) {

		const token = tokenService.token;
		this.updateCurrentUserData(token);
		if (platform.isBrowser) { this.engageRenewTokenTimer(token); }
	}


	// ---------------------------------------
	// ------------ USER METHODS -------------
	// ---------------------------------------

	/**
	 * Updates the user data field by decoding the JWT token
	 * @param  {string} token the JWT token to decode
	 */
	private updateCurrentUserData(token: string) {
		if (!token) { return; }
		const u = this.tokenService.jwtDecode(token);
		if (!u) { return; }
		this._userSubject.next(u);
	}

	/**
	 * Starts a timer to renew the jwt before it exires
	 * @param  {string}       token token to base the renewal timer on
	 */
	private engageRenewTokenTimer(token: string) {
		// cancel any ongoing timers
		if (this._renewalSub) { this._renewalSub.unsubscribe(); }
		// Log out the user if it is too late to renew.
		if (this.tokenService.jwtIsExpired(token)) { this.logOut(); return; }
		// Engage a new timer to go off 20 minutes before expiration token
		const renewalDate = new Date(this.tokenService.jwtExpirationDate(token).getTime() - 1000 * 60 * 20);
		this._renewalSub = timer(renewalDate).subscribe(time => {
			this.renewToken().subscribe(userToken => {
				if (userToken.token) {
					this.engageRenewTokenTimer(userToken.token);
					return;
				}
				this.openSnackBar('Session expired', '');
				this.logOut();
			});
		});
	}


	// ---------------------------------------
	// ----------- HELPER METHODS ------------
	// ---------------------------------------



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
	 * Returns the expiration state of the currently loggged in user
	 */
	public getUserSessionExpired(): boolean {
		return this.tokenService.jwtIsExpired(this.tokenService.token);
	}

	/**
	 * Returns true if the user is of the given role
	 * @param  {AccessRoles}      role The role to compare against
	 * @return {boolean}          whether the user is of the given role
	 */
	public isUserOfRole(role: AccessRoles): boolean {
		const user = this.user.getValue();
		return user && user.role === role;
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
		return this.http.client.post<UserToken>(this.http.apiUrl(env.API.auth.login), user).pipe(map(
			(userToken) => {
				if (!userToken) { return false; }

				// Set token
				this.tokenService.token = userToken.token;
				// Engage token renewal timer
				this.engageRenewTokenTimer(userToken.token);
				// Set user data & Notify subscribers
				this.updateCurrentUserData(userToken.token);
				return true;
			},
			(err) => false
		));
	}

	/**
	 * Log out current user
	 */
	public logOut() {
		if (this._userSubject.getValue() === null) { return; }

		// If this post errors out (401), then the API already deems you as an unauthorized user
		return this.http.client.post(this.http.apiUrl(env.API.auth.logout), null).pipe(
			finalize(() => {
				this.tokenService.token = null;
				if (this._renewalSub) { this._renewalSub.unsubscribe(); }
				this._userSubject.next(null);

				this.router.navigateByUrl('/');
			})
		).subscribe();
	}

	/**
	 * Attempt to renew JWT token
	 * @return {Observable<boolean>} wether the JWT was successfully renewed
	 */
	public renewToken(): Observable<UserToken> {
		return this.http.client.get<UserToken>(this.http.apiUrl(env.API.auth.token)).pipe(
			map(userToken => {
				this.tokenService.token = userToken.token;    // Set token
				return userToken;
			}),
		);
	}

	/**
	 * Attempt to update the logged in user's password
	 * @param  {UpdatePasswordUser}  user the object containing the user data
	 * @return {Observable<boolean>}      wether the password was successfully updated
	 */
	public updatePassword(user: UpdatePasswordUser): Observable<boolean> {
		return this.http.client.post<boolean>(this.http.apiUrl(env.API.auth.updatepass), user).pipe(
			map(() => true),
			catchError(err => of(false))
		); // returns message objects
	}
}
