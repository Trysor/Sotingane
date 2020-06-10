import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';

import { AuthService } from '@app/services/controllers/auth.service';
import { ModalService } from '@app/services/utility/modal.service';

import { handleForUser } from './guard.user.handler';
import { map } from 'rxjs/operators';
import { AccessRoles } from '@types';


@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate, CanLoad {

	constructor(
		private authService: AuthService,
		private modalService: ModalService,
		private router: Router) { }

	private handleAccess() {
		const accessGranted = this.authService.isUserOfRole(AccessRoles.admin);
		if (!accessGranted) {
			return this.modalService.openLoginModal().afterClosed().pipe(map(x => {
				const loginSuccessful = !!this.authService.user.getValue();
				if (!loginSuccessful || !this.authService.isUserOfRole(AccessRoles.admin)) {
					this.router.navigateByUrl('/');
				}
				return loginSuccessful;
			}));
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
