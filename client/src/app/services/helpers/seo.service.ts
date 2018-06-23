import { Injectable, Inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

import { env } from '@env';
import { CmsContent } from '@app/models';

import { HttpService } from '@app/services/http/http.service';
import { CMSService } from '@app/services/controllers/cms.service';

import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class SEOService {
	private readonly _logo = new BehaviorSubject<object>(null);
	private readonly _bread = new BehaviorSubject<object>(null);


	public get logo() { return this._logo; }
	public get bread() { return this._bread; }

	constructor(
		private router: Router,
		private cmsService: CMSService,
		private httpService: HttpService) {

		// Set logo. This one is static
		this._logo.next({
			'@context': 'http://schema.org',
			'@type': 'Organization',
			'url': this.httpService.urlBase,
			'logo': this.httpService.urlBase + '/assets/logo192themed.png' // can't be svg.
		});

		// Handle Breadcrumb
		const setBread = (route: string) => {
			const content = cmsService.getContentList(false).getValue().find(c => route.includes(c.route));
			this._bread.next(this.seoBreadcrumb(this.httpService.urlBase + route, content));
		};
		// Set breadcrumb for current url, once we have route data from CMS
		// take(2) -- first is null, second is received from server
		// The hook below is used for future navigation
		cmsService.getContentList(false).pipe(take(2)).subscribe(contentList => {
			if (contentList) { setBread(router.routerState.snapshot.url); }
		});

		// Hook for navigation events
		router.events.pipe(
			filter(e => e instanceof NavigationStart)
		).subscribe(
			(e: NavigationStart) => setBread(e.url)
		);
	}



	private seoBreadcrumb(fullUrl: string, content: CmsContent): object {
		const json = {
			'@context': 'http://schema.org',
			'@type': 'BreadcrumbList',
			'itemListElement': [{
				'@type': 'ListItem',
				'position': 1,
				'item': {
					'@id': this.httpService.urlBase,
					'name': env.META.title,
				}
			}]
		};

		if (!content || !fullUrl) { return json; }

		json.itemListElement.push({
			'@type': 'ListItem',
			'position': 2,
			'item': {
				'@id': fullUrl,
				'name': content.title,
			}
		});
		return json;
	}
}
