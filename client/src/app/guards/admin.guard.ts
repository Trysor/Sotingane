import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';

import { AuthService } from '@app/services';
import { AccessRoles } from '@types';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate, CanLoad {

	constructor(
		private authService: AuthService,
		private router: Router) { }


	/**
	 * Dictates the access rights to a given route
	 */
	canActivate() {
		const accessGranted = this.authService.isUserOfRole(AccessRoles.admin);
		if (!accessGranted) {
			this.router.navigateByUrl('/');
		}
		return accessGranted;
	}

	canLoad() {
		return this.canActivate();
	}

}
