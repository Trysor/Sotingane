import { Injectable } from '@angular/core';

import { env } from '@env';
import { Content, SearchResultContent } from '@types';

import { makeStateKey } from '@angular/platform-browser';
const LIST_KEY = makeStateKey<Content[]>('cmslist'),
	PAGE_KEY = makeStateKey<Content>('cmspage'),
	SEARCH_KEY = makeStateKey<SearchResultContent[]>('cmssearch');

import { AuthService } from '@app/services/controllers/auth.service';
import { HttpService } from '@app/services/http/http.service';

import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class CMSService {
	private readonly _listSubject: BehaviorSubject<Content[]> = new BehaviorSubject(null);
	private _pageSubject: BehaviorSubject<Content> = new BehaviorSubject(null);

	private readonly _failedToLoad: Content = <Content>{
		access: [],
		title: 'Page not available',
		content: 'Uhm. There appears to be nothing here. Sorry.',
		description: '404 - Not found',
		version: 0,
		route: '',
	};

	constructor(
		private authService: AuthService,
		private http: HttpService) {

		// Whenever a user logs in or out we should force-update.
		this.authService.user.subscribe(() => {
			this.getContentList(true);
		});
	}

	public get content() {
		return this._pageSubject;
	}


	/**
	 * Gets the cmsRoutes as a BehaviorSubject
	 * @param  {[boolean]}                        forceUpdate, whether to force update. Defaults to false.
	 * @return {BehaviorSubject<Content[]>}    the BehaviorSubject
	 */
	public getContentList(forceUpdate = false): BehaviorSubject<Content[]> {
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
	 * @return {Observable<Content[]>}       Server's response, as an Observable
	 */
	private requestContentList(): Observable<Content[]> {
		return this.http.fromState(
			LIST_KEY,
			this.http.client.get<Content[]>(this.http.apiUrl(env.API.cms.content))
		);
	}

	/**
	 * Requests the content from the given url
	 * @return {Observable<Content>}         Server's response, as an Observable
	 */
	public searchContent(searchTerm: string): Observable<SearchResultContent[]> {
		return this.http.fromState(
			SEARCH_KEY,
			this.http.client.get<SearchResultContent[]>(this.http.apiUrl(env.API.cms.search + '/' + searchTerm))
		);
	}

	/**
	 * Requests the content from the given url
	 */
	public requestContent(contentUrl: string) {
		this.http.fromState(
			PAGE_KEY,
			this.http.client.get<Content>(this.http.apiUrl(env.API.cms.content + '/' + contentUrl))
		).pipe(
			catchError(() => of(this._failedToLoad))
		).subscribe(content => this._pageSubject.next(content));
	}

	/**
	 * Requests the content History array from the given url
	 * @return {Observable<Content>}         Server's response, as an Observable
	 */
	public requestContentHistory(contentUrl: string): Observable<Content[]> {
		return this.http.client.get<Content[]>(this.http.apiUrl(env.API.cms.history + '/' + contentUrl));
	}

	/**
	 * Requests to update the content for a given url
	 * @return {Observable<Content>}         Server's response, as an Observable
	 */
	public updateContent(contentUrl: string, updatedContent: Content): Observable<Content> {
		return this.http.client.patch<Content>(this.http.apiUrl(env.API.cms.content + '/' + contentUrl), updatedContent);
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
	 * @return {Observable<Content>}         Server's response, as an Observable
	 */
	public createContent(newContent: Content): Observable<Content> {
		return this.http.client.post<Content>(this.http.apiUrl(env.API.cms.content), newContent);
	}
}
