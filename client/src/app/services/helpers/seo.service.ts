import { Injectable, Inject } from '@angular/core';

import { env } from '@env';

import { HttpService } from '@app/services/http/http.service';

@Injectable({ providedIn: 'root' })
export class SEOService {
	public get seoLogo(): object {
		return {
			'@context': 'http://schema.org',
			'@type': 'Organization',
			'url': this.httpService.urlBase,
			'logo': this.httpService.urlBase + '/assets/logo192themed.png' // can't be svg.
		};
	}

	public get seoBreadcrumb(): object {

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

		// json.itemListElement.push({
		// 	'@type': 'ListItem',
		// 	'position': 2,
		// 	'item': {
		// 		'@id': this.route.snapshot.url.toString(),
		// 		'name': '' // TODO: fix me
		// 	}
		// });

		return json;
	}


	constructor(private httpService: HttpService) {	}
}
