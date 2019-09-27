import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';

import { AuthService } from '@app/services/controllers/auth.service';
import { handleForUser } from './guard.user.handler';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanLoad {

	constructor(private authService: AuthService, private router: Router) { }

	private handleAccess() {
		const accessGranted = !!this.authService.user.getValue();
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
