import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from '@app/services';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {

	constructor(
		private authService: AuthService,
		private router: Router) { }


	/**
	 * Dictates the access rights to a given route
	 */
	canActivate() {
		const accessGranted = !this.authService.user.getValue();
		if (!accessGranted) {
			this.router.navigateByUrl('/');
		}
		return accessGranted;
	}

}
