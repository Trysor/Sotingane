import { Component, OnDestroy, ChangeDetectionStrategy, ElementRef } from '@angular/core';

import { IntersectionService } from '@app/services';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


export abstract class DynamicLazyLoader implements OnDestroy {
	protected _ngUnsub = new Subject();
	private _unobserved = false;

	constructor(
		private el: ElementRef<HTMLElement>,
		private inter: IntersectionService) {
	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();

		if (this.el && !this._unobserved) {
			this.inter.unobserve(this.el.nativeElement);
		}
	}

	/**
	 * The initialization method for the lazy loader.
	 * @param elem the element to observe
	 */
	public hookLazyLoader(elem: HTMLElement) {
		// Hook
		const sub = this.inter.targets.pipe(takeUntil(this._ngUnsub)).subscribe(entries => {
			const index = entries.map(entry => entry.target).indexOf(elem);
			if (index === -1 || !entries[index].isIntersecting) { return; }

			// Load our lazy target
			this._unobserved = true;
			this.inter.unobserve(elem);
			this.load();
			sub.unsubscribe();
		});

		// Start observing
		this.inter.observe(elem);
	}

	/**
	 * Abstract load method; subclasses need to implement this.
	 * The method should contain code that completes the loading process.
	 */
	abstract load(): void;
}
