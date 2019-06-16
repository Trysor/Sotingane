import { Injectable } from '@angular/core';

import { PlatformService } from '@app/services/utility/platform.service';

import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class IntersectionService {
	private _obs: IntersectionObserver;
	private _subject = new BehaviorSubject<Element[]>([]);

	public get targets() { return this._subject; }

	constructor(private platform: PlatformService) {
		if (platform.isServer) { return; }

		this._obs = new IntersectionObserver(
			(entries: IntersectionObserverEntry[]) => {
				this._subject.next(
					entries
						.filter(entry => entry.intersectionRatio > 0)
						.map(entry => entry.target)
				);
			},
			{
				rootMargin: '0px',
				threshold: 0.01 // 1% should be visible
			}
		);
	}


	/**
	 * Observe the on-screen visiblity of a given element
	 */
	public observe(el: Element) {
		if (this.platform.isServer) { return; }
		this._obs.observe(el);
	}

	/**
	 * Unobserves an element
	 */
	public unobserve(el: Element) {
		if (this.platform.isServer) { return; }
		this._obs.unobserve(el);
	}
}
