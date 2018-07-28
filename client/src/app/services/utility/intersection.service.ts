import { Injectable } from '@angular/core';

import { PlatformService } from '@app/services/utility/platform.service';

import { Subject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class IntersectionService {
	private _obs: IntersectionObserver;
	private _subject = new Subject<IntersectionObserverEntry[]>();

	public get targets() { return this._subject; }

	constructor(private platform: PlatformService) {
		if (platform.isServer) { return; }

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
		if (this.platform.isBrowser) {
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
		if (this.platform.isServer) { return; }
		this._obs.unobserve(el);
	}
}
