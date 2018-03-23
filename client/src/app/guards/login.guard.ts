import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from '@app/services';
import { AccessRoles } from '@app/models';

@Injectable()
export class LoginGuard implements CanActivate {

	constructor(
		private authService: AuthService,
		private router: Router) { }


	/**
	 * Dictates the access rights to a given route
	 * @return {boolean} whether access is granted
	 */
	canActivate() {
		const isExpired = this.authService.getUserSessionExpired();
		const accessGranted = !this.authService.getUser().getValue() || isExpired;
		if (!accessGranted) {
			this.router.navigateByUrl('/');
		}
		return accessGranted;
	}

}
