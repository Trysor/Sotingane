import { Injectable, Inject, PLATFORM_ID, ElementRef, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/platform-browser';

import { Subject } from 'rxjs/Subject';


@Injectable()
export class IntersectionService {
	private _obs: IntersectionObserver;
	private _subject = new Subject<IntersectionObserverEntry[]>();

	public get targets() { return this._subject; }

	constructor(
		@Inject(DOCUMENT) private document: Document,
		@Inject(PLATFORM_ID) private platformId: Object) {

		if (!isPlatformBrowser(platformId)) { return; }

		this._obs = new IntersectionObserver(
			(entries: IntersectionObserverEntry[]) => {
				this._subject.next(entries);
			},
			{
				rootMargin: '0px',
				threshold: 0.01 // 1% should be visible
			}
		);
	}


	/**
	 * Observe the on-screen visiblity of a given element
	 * @param el
	 */
	public observe(el: Element) {
		this._obs.observe(el);
	}

	/**
	 * Unobserves an element
	 * @param el
	 */
	public unobserve(el: Element) {
		this._obs.unobserve(el);
	}
}
