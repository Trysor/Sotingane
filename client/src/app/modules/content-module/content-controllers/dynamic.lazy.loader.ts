import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { IntersectionService } from '@app/services';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


export abstract class DynamicLazyLoader implements OnDestroy {
	protected _ngUnsub = new Subject();
	private _elem: Element;
	private _unobserved = false;

	constructor(private inter: IntersectionService) { }

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();

		if (this._elem && !this._unobserved) {
			this.inter.unobserve(this._elem);
		}
	}


	/**
	 * The initialization method for the lazy loader.
	 * @param elem the element to observe
	 */
	public init(elem: Element) {
		if (this._elem) { return; }

		this._elem = elem;
		this.inter.observe(elem);

		this.inter.targets.pipe(takeUntil(this._ngUnsub)).subscribe(entries => {
			const index = entries.map(entry => entry.target).indexOf(elem);
			if (index === -1) { return; }

			// Load our lazy target
			if (entries[index].isIntersecting) {
				this._unobserved = true;
				this.inter.unobserve(elem);
				this.load();
			}
		});
	}


	/**
	 * Abstract load method; subclasses need to implement this.
	 * The method should contain code that completes the loading process.
	 */
	abstract load(): void;
}
