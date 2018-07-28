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
	private readonly _article = new BehaviorSubject<object>(null);

	public get logo() { return this._logo; }
	public get bread() { return this._bread; }
	public get article() { return this._article; }

	private readonly _orgLogoURL: string;

	constructor(
		private router: Router,
		private cmsService: CMSService,
		private httpService: HttpService) {

		// Org Logo can't be svg.
		this._orgLogoURL = this.httpService.urlBase + '/assets/logo192themed.png';

		// Set logo. This one is static
		this._logo.next({
			'@context': 'http://schema.org',
			'@type': 'Organization',
			'url': this.httpService.urlBase,
			'logo': this._orgLogoURL
		});

		// Handle Breadcrumb
		const setRouteSEO = (route: string) => {
			const content = cmsService.content.getValue();
			const url = this.httpService.urlBase + route;

			// Breadcrumbs go for all pages
			this._bread.next(this.seoBreadcrumb(url, content));

			// Articles go for CMS content only
			if (content && content.images && content.images.length > 0) {
				this._article.next(this.seoArticle(url, content));
			} else {
				this._article.next(null);
			}
		};

		// Hook content change
		cmsService.content.subscribe((content) => {
			if (content) { setRouteSEO(router.routerState.snapshot.url); }
		});

		// Hook for navigation events
		router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(
			(e: NavigationStart) => setRouteSEO(e.url)
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

	private seoArticle(fullUrl: string, content: CmsContent): object {
		return {
			'@context': 'http://schema.org',
			'@type': 'Article',
			'headline': content.title,
			'description': content.description,
			'image': content.images,
			'datePublished': content.createdAt,
			'dateModified': content.updatedAt,
			'author': {
				'@type': 'Person',
				'name': content.createdBy.username
			},
			'mainEntityOfPage': fullUrl,
			'publisher': {
				'@type': 'Organization',
				'name': env.ORG,
				'logo': {
					'@type': 'ImageObject',
					'url': this._orgLogoURL
				}
			}
		};
	}
}
