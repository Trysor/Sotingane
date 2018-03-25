import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

import { ComposeComponent } from '@app/modules/compose-module/compose-component/compose.component';


@Injectable({ providedIn: 'root' })
export class DeactivateGuard implements CanDeactivate<ComposeComponent> {

	/**
	 * Dictates the access rights to a given route
	 * @return {boolean|Subject<boolean>} whether access is granted
	 */
	canDeactivate(comp: ComposeComponent) {
		return comp.canDeactivate();
	}
}
