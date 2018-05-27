import { Injectable, Inject, PLATFORM_ID, ElementRef, OnInit } from '@angular/core';
import { isPlatformServer } from '@angular/common';

import { Subject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class IntersectionService {
	private _obs: IntersectionObserver;
	private _subject = new Subject<IntersectionObserverEntry[]>();
	private _isServer: boolean;

	public get targets() { return this._subject; }

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object) {

		this._isServer = isPlatformServer(platformId);
		if (this._isServer) { return; }

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
		if (!this._isServer) {
			this._obs.observe(el);
			return;
		}

		// On server
		const intersect: IntersectionObserverEntry = {
			target: el, // the element
			isIntersecting: true, // isIntersecting
			boundingClientRect: null,
			intersectionRatio: 1,
			intersectionRect: null,
			rootBounds: null,
			time: 0
		};
		this._subject.next([intersect]);
	}

	/**
	 * Unobserves an element
	 * @param el
	 */
	public unobserve(el: Element) {
		if (this._isServer) { return; }
		this._obs.unobserve(el);
	}
}
