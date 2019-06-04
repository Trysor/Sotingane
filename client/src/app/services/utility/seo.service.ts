import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { Content, SEO_Article, SEO_BreadcrumbList, SEO_Organization } from '@types';

import { HttpService } from '@app/services/http/http.service';
import { CMSService } from '@app/services/controllers/cms.service';
import { SettingsService } from '@app/services/controllers/settings.service';
import { PlatformService } from '@app/services/utility/platform.service';

import { BehaviorSubject } from 'rxjs';
import { filter, combineLatest } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class SEOService {
	private readonly _logo = new BehaviorSubject<SEO_Organization>(null);
	private readonly _bread = new BehaviorSubject<SEO_BreadcrumbList>(null);
	private readonly _article = new BehaviorSubject<SEO_Article>(null);

	public get logo() { return this._logo; }
	public get bread() { return this._bread; }
	public get article() { return this._article; }

	private readonly _orgLogoURL: string;

	constructor(
		private router: Router,
		private settingsService: SettingsService,
		private cmsService: CMSService,
		private httpService: HttpService,
		private platformService: PlatformService,
		private title: Title,
		private meta: Meta) {

		// Org Logo can't be svg.
		this._orgLogoURL = this.httpService.urlBase + '/assets/logo192themed.png';

		// Subscribe to the combination of valid
		this.settingsService.settings.pipe(
			filter(x => !!x && x.org.length > 0), // settings should not be allowed to be null or empty
			combineLatest(this.cmsService.content), // may be null
		).subscribe(resultList => {

			// Set logo. This one is static
			this._logo.next({
				'@context': 'https://schema.org/',
				'@type': 'Organization',
				'url': this.httpService.urlBase,
				'name': resultList[0].org,
				'logo': this._orgLogoURL
			});

			// Set Breadcrumb and Article
			const url = this.httpService.urlBase + this.router.routerState.snapshot.url;
			const content = resultList[1];

			// Breadcrumbs go for all pages
			this._bread.next(this.seoBreadcrumb(url, content));
			// Articles go for CMS content only
			this._article.next((content && content.images && content.images.length > 0) ? this.seoArticle(url, content) : null);

			if (!!content) {
				this.setContentMeta(content);
			} else {
				this.setDefaultMeta();
			}
		});
	}


	// ---------------------------------------
	// ---------- META DATA METHODS ----------
	// ---------------------------------------

	/**
	 * Sets metadata to the default values provided in the environment variables
	 */
	private setDefaultMeta() {
		this.title.setTitle(this.settingsService.settings.getValue().meta.title);
		this.meta.updateTag({ name: 'description', content: this.settingsService.settings.getValue().meta.desc });
		this.updateCanonical();
	}


	/**
	 * Sets metadata based on content
	 * @param Content
	 */
	private setContentMeta(content: Content) {
		this.meta.updateTag({ name: 'description', content: content.description });
		this.title.setTitle(`${this.settingsService.settings.getValue().meta.title} - ${content.title}`);
		this.updateCanonical();
	}


	private updateCanonical() {
		const doc = this.platformService.document;
		let linkElem = doc.head.querySelector('link[rel=canonical]');
		if (!linkElem) {
			linkElem = doc.createElement('link');
			linkElem.setAttribute('rel', 'canonical');
			doc.head.appendChild(linkElem);
		}

		const routerUrl = this.router.routerState.snapshot.url;
		let canonical = this.httpService.urlBase;

		if (routerUrl === '' || routerUrl === '/') {
			canonical = `${canonical}/${this.settingsService.settings.getValue().indexRoute}`;
		} else {
			canonical = canonical + routerUrl;
		}
		linkElem.setAttribute('href', canonical);
	}


	// ---------------------------------------
	// ------------- SEO METHODS -------------
	// ---------------------------------------

	/**
	 * Creates a json SEO Breadcrumb object
	 * @param fullUrl the full url to the website, including protocol and domain
	 * @param content content, if any, at the given page
	 */
	private seoBreadcrumb(fullUrl: string, content: Content): SEO_BreadcrumbList {
		const json: SEO_BreadcrumbList = {
			'@context': 'http://schema.org/',
			'@type': 'BreadcrumbList',
			'itemListElement': [{
				'@type': 'ListItem',
				'position': 1,
				'item': this.httpService.urlBase,
				'name': this.settingsService.settings.getValue().meta.title,
			}]
		};

		if (!content || !fullUrl) { return json; }

		json.itemListElement.push({
			'@type': 'ListItem',
			'item': fullUrl,
			'position': 2,
			'name': content.title,
		});
		return json;
	}

	/**
	 * Creates a json SEO Article object
	 * @param fullUrl the full url to the website, including protocol and domain
	 * @param content content at the given page. Required.
	 */
	private seoArticle(fullUrl: string, content: Content): SEO_Article {
		return {
			'@context': 'http://schema.org/',
			'@type': 'Article',
			'headline': content.title,
			'description': content.description,
			'image': content.images.map(data => data.url),
			'datePublished': content.createdAt,
			'dateModified': content.updatedAt,
			'author': {
				'@type': 'Person',
				'name': content.createdBy.username
			},
			'mainEntityOfPage': fullUrl,
			'publisher': {
				'@type': 'Organization',
				'name': this.settingsService.settings.getValue().org,
				'url': this.httpService.urlBase,
				'logo': {
					'@type': 'ImageObject',
					'url': this._orgLogoURL
				}
			}
		};
	}
}
