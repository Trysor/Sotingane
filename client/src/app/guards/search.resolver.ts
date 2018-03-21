import { Injectable } from '@angular/core';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { CmsContent } from '@app/models';
import { CMSService } from '@app/services';

import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class SearchResolver implements Resolve<CmsContent[] | boolean> {

	constructor(
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
	resolve(route: ActivatedRouteSnapshot): Observable<CmsContent[] | boolean> {
		return this.cmsService.searchContent(route.params.term).pipe(
			map(
				content => content,
				err => null
			),
			catchError(err => of(null)),
		);
	}
}
