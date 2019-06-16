import { Injectable } from '@angular/core';

import { env } from '@env';
import { Content, SearchResultContent } from '@types';

import { HttpService } from '@app/services/http/http.service';

import { BehaviorSubject, of, combineLatest } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class CMSService {
	private readonly _listSubject: BehaviorSubject<Content[]> = new BehaviorSubject(null);
	private _pageSubject: BehaviorSubject<Content> = new BehaviorSubject(null);

	private readonly _failedToLoad: Content = {
		access: [],
		title: 'Page not available',
		content: 'Uhm. There appears to be nothing here. Sorry.',
		description: '404 - Not found',
		version: 0,
		route: '',
	};

	public get content() { return this._pageSubject; }

	constructor(private http: HttpService) { }

	/**
	 * Gets the cmsRoutes as a BehaviorSubject
	 */
	public getContentList(forceUpdate = false) {
		if (forceUpdate) {
			this.requestContentList().subscribe(list => this._listSubject.next(list));
		}

		return this._listSubject;
	}

	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	/**
	 * Requests the content list
	 */
	private requestContentList() {
		return this.http.client.get<Content[]>(env.API.cms.content);
	}

	/**
	 * Requests the content from the given url
	 */
	public searchContent(searchTerm: string) {
		return this.http.client.get<SearchResultContent[]>(`${env.API.cms.search}/${searchTerm}`);
	}

	/**
	 * Requests the content from the given url
	 */
	public requestContent(contentUrl: string) {
		this.http.client.get<Content>(`${env.API.cms.content}/${contentUrl}`).pipe(
			catchError(() => of(this._failedToLoad))
		).subscribe(content => this._pageSubject.next(content));
	}

	/**
	 * Requests the content History array from the given url
	 */
	public requestContentHistory(contentUrl: string) {
		return this.http.client.get<Content[]>(`${env.API.cms.history}/${contentUrl}`);
	}

	/**
	 * Requests to update the content for a given url
	 */
	public updateContent(contentUrl: string, updatedContent: Content) {
		return this.http.client.patch<Content>(`${env.API.cms.content}/${contentUrl}`, updatedContent);
	}

	/**
	 * Requests to update the content for a given url
	 */
	public deleteContent(contentUrl: string) {
		return this.http.client.delete<boolean>(`${env.API.cms.content}/${contentUrl}`);
	}

	/**
	 * Requests to create the content for a given url
	 */
	public createContent(newContent: Content) {
		return this.http.client.post<Content>(env.API.cms.content, newContent);
	}
}
