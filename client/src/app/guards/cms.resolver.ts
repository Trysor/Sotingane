import { Injectable } from '@angular/core';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { CmsContent, AccessRoles } from '@app/models';
import { CMSService, AuthService, TokenService } from '@app/services';

import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class CmsResolver implements Resolve<CmsContent | boolean> {

	constructor(
		private tokenService: TokenService,
		private authService: AuthService,
		private cmsService: CMSService,
		private router: Router) { }

	/**
	 * Resolves access to a CMS content page. The resolver returns the content for a given page
	 * if the user is authorized, and otherwise returns true (without the content).
	 * A true value grants access to the angular route, and the CMS content component displays
	 * an error page instead of the actual content.
	 * An alternative is to redirect to an error page, and return false.
	 * @param  {ActivatedRouteSnapshot} route
	 * state: RouterStateSnapshot
	 * @return {Observable}             Obeservable of CmsContent or boolean; whether access is granted.
	 */
	resolve(route: ActivatedRouteSnapshot): Observable<CmsContent | boolean> {
		return this.cmsService.requestContent(route.params.content).pipe(
			map(
				content => {
					// Grant access if access is everyone
					if (content.access === AccessRoles.everyone) { return content; }

					// if access isn't everyone, login is required
					if (this.authService.getUser() || !this.authService.jwtIsExpired(this.tokenService.token)) {
						// if logged in, the required access privileges are required
						if (this.authService.isUserOfRole(content.access) || this.authService.isUserOfRole(AccessRoles.admin)) {
							return content;
						}
					}
					return true;
				},
				err => true
			),
			catchError(err => of(true)),
		);
	}
}
