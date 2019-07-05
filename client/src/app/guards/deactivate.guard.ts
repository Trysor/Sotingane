import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DeactivateGuard<T extends CanDeactivate<T>> implements CanDeactivate<T> {
	/**
	 * Denies the user from leaving a route until conditions are met
	 */
	canDeactivate(
		comp: T,
		currRoute: ActivatedRouteSnapshot,
		currState: RouterStateSnapshot, nextState?: RouterStateSnapshot) {

		return comp && comp.canDeactivate(comp, currRoute, currState, nextState);
	}
}
