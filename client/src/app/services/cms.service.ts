import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '@env';
import { CmsContent } from '@app/models';

import { AuthService } from '@app/services/auth.service';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { timeout } from 'rxjs/operators';


@Injectable()
export class CMSService {
	private _listSubject: BehaviorSubject<CmsContent[]> = new BehaviorSubject(null);

	constructor(
		private authService: AuthService,
		private http: HttpClient,
		private router: Router) {

		// Whenever a user logs in or out, update
		authService.getUser().subscribe(user => this.getContentList(true));
	}

	/**
	 * Gets the cmsRoutes as a BehaviorSubject
	 * @param  {[boolean]}                        forceUpdate, whether to force update. Defaults to false.
	 * @return {BehaviorSubject<CmsContent[]>}    the BehaviorSubject
	 */
	public getContentList(forceUpdate = false): BehaviorSubject<CmsContent[]> {
		if (!forceUpdate) { return this._listSubject; }

		const sub = this.requestContentList().subscribe(contentList => {
			sub.unsubscribe();
			this._listSubject.next(contentList);
		});
		return this._listSubject;
	}

	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	/**
	 * Requests the content list
	 * @return {Observable<CmsContent[]>}         Server's response, as an Observable
	 */
	private requestContentList(): Observable<CmsContent[]> {
		return this.http.get<CmsContent[]>(environment.URL.cms.content).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Requests the content from the given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public searchContent(searchTerm: string): Observable<CmsContent[]> {
		return this.http.get<CmsContent[]>(environment.URL.cms.search + '/' + searchTerm).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Requests the content from the given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public requestContent(contentUrl: string): Observable<CmsContent> {
		return this.http.get<CmsContent>(environment.URL.cms.content + '/' + contentUrl).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Requests the content History array from the given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public requestContentHistory(contentUrl: string): Observable<CmsContent[]> {
		return this.http.get<CmsContent[]>(environment.URL.cms.history + '/' + contentUrl).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Requests to update the content for a given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public updateContent(contentUrl: string, updatedContent: CmsContent): Observable<CmsContent> {
		return this.http.patch<CmsContent>(environment.URL.cms.content + '/' + contentUrl, updatedContent).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Requests to update the content for a given url
	 * @return {Observable<boolean>}         Server's response, as an Observable
	 */
	public deleteContent(contentUrl: string): Observable<boolean> {
		return this.http.delete<boolean>(environment.URL.cms.content + '/' + contentUrl).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Requests to create the content for a given url
	 * @return {Observable<CmsContent>}         Server's response, as an Observable
	 */
	public createContent(newContent: CmsContent): Observable<CmsContent> {
		return this.http.post<CmsContent>(environment.URL.cms.content, newContent).pipe(timeout(environment.TIMEOUT));
	}
}
