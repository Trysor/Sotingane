import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';

import { AuthService } from '@app/services';
import { AccessRoles } from '@types';

import { handleForUser } from './guard.user.handler';


@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate, CanLoad {

	constructor(private authService: AuthService, private router: Router) { }

	private handleAccess() {
		const accessGranted = this.authService.isUserOfRole(AccessRoles.admin);
		if (!accessGranted) {
			this.router.navigateByUrl('/');
		}
		return accessGranted;
	}

	canActivate() {
		return handleForUser(this.authService, this.handleAccess.bind(this));
	}

	canLoad() {
		return this.canActivate();
	}
}
