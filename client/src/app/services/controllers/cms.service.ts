import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { env } from '@env';
import { CmsContent, AccessRoles } from '@app/models';

import { makeStateKey } from '@angular/platform-browser';
const LIST_KEY = makeStateKey<CmsContent[]>('cmslist'),
	PAGE_KEY = makeStateKey<CmsContent>('cmspage'),
	SEARCH_KEY = makeStateKey<CmsContent[]>('cmssearch');

import { AuthService } from '@app/services/controllers/auth.service';
import { HttpService } from '@app/services/http/http.service';

import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CMSService {
	private _listSubject: BehaviorSubject<CmsContent[]> = new BehaviorSubject(null);
	private _pageSubject: BehaviorSubject<CmsContent> = new BehaviorSubject(null);

	private readonly _failedToLoad: CmsContent = {
		access: AccessRoles.everyone,
		title: 'Page not available',
		content: 'Uhm. There appears to be nothing here. Sorry.',
		description: '404 - Not found',
		version: 0,
		route: '',
	};

	constructor(
		private authService: AuthService,
		private http: HttpService,
		private router: Router) {

		// Whenever a user logs in or out we should force-update.
		authService.user.subscribe(user => this.getContentList(true));
	}

	public get content() {
		return this._pageSubject;
	}


	/**
	 * Gets the cmsRoutes as a BehaviorSubject
	 * @param  {[boolean]}                        forceUpdate, whether to force update. Defaults to false.
	 * @return {BehaviorSubject<CmsContent[]>}    the BehaviorSubject
	 */
	public getContentList(forceUpdate = false): BehaviorSubject<CmsContent[]> {
		if (!forceUpdate) { return this._listSubject; }

		this.requestContentList().subscribe(contentList => {
			this._listSubject.next(contentList);
		});
		return this._listSubject;
	}

	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	/**
	 * Requests the content list
	 * @return {Observable<CmsContent[]>}       Server's response, as an Observable
	 */
	private requestContentList(): Observable<CmsContent[]> {
		return this.http.client.get<CmsContent[]>(this.http.apiUrl(env.API.cms.content));
		// return this.http.transferStateForRequest(LIST_KEY, this.http.get<CmsContent[]>(environment.URL.cms.content));
	}

	/**
	 * Requests the content from the given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public searchContent(searchTerm: string): Observable<CmsContent[]> {
		return this.http.fromState(
			SEARCH_KEY,
			this.http.client.get<CmsContent[]>(this.http.apiUrl(env.API.cms.search + '/' + searchTerm))
		);
	}

	/**
	 * Requests the content from the given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public requestContent(contentUrl: string) {
		this.http.fromState(
			PAGE_KEY,
			this.http.client.get<CmsContent>(this.http.apiUrl(env.API.cms.content + '/' + contentUrl))
		).subscribe(
			content => this._pageSubject.next(content),
			error => this._pageSubject.next(this._failedToLoad)
		);
	}

	/**
	 * Requests the content History array from the given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public requestContentHistory(contentUrl: string): Observable<CmsContent[]> {
		return this.http.client.get<CmsContent[]>(this.http.apiUrl(env.API.cms.history + '/' + contentUrl));
	}

	/**
	 * Requests to update the content for a given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public updateContent(contentUrl: string, updatedContent: CmsContent): Observable<CmsContent> {
		return this.http.client.patch<CmsContent>(this.http.apiUrl(env.API.cms.content + '/' + contentUrl), updatedContent);
	}

	/**
	 * Requests to update the content for a given url
	 * @return {Observable<boolean>}         Server's response, as an Observable
	 */
	public deleteContent(contentUrl: string): Observable<boolean> {
		return this.http.client.delete<boolean>(this.http.apiUrl(env.API.cms.content + '/' + contentUrl));
	}

	/**
	 * Requests to create the content for a given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public createContent(newContent: CmsContent): Observable<CmsContent> {
		return this.http.client.post<CmsContent>(this.http.apiUrl(env.API.cms.content), newContent);
	}
}
