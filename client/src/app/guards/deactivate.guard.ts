import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

import { ComposeComponent } from '@app/modules/compose-module/compose-component/compose.component';
import { AuthService } from '@app/services/controllers/auth.service';

import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeactivateGuard implements CanDeactivate<ComposeComponent> {

	constructor(private authService: AuthService) { }

	/**
	 * Denies the user from leaving a route until conditions are met
	 */
	canDeactivate(comp: ComposeComponent): boolean|Observable<boolean> {
		if (!this.authService.user.getValue()) { return true; }
		return comp.canDeactivate();
	}
}
