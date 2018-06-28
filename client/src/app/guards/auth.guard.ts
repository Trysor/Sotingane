import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from '@app/services';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

	constructor(
		private authService: AuthService,
		private router: Router) { }


	/**
	 * Dictates the access rights to a given route
	 * @return {boolean} whether access is granted
	 */
	canActivate() {
		const isExpired = this.authService.getUserSessionExpired();
		const accessGranted = this.authService.user.getValue() && !isExpired;
		if (!accessGranted) {
			this.router.navigateByUrl('/');
		}
		return accessGranted;
	}

}
