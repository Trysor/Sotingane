import { OnDestroy, ElementRef } from '@angular/core';

import { IntersectionService } from '@app/services';

import { Subject } from 'rxjs';
import { takeUntil, take, filter } from 'rxjs/operators';


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

		if (this.el && this.inter && !this._unobserved) {
			this.inter.unobserve(this.el.nativeElement);
		}
	}

	/**
	 * The initialization method for the lazy loader.
	 * @param elem the element to observe
	 */
	public hookLazyLoader(elem: HTMLElement) {
		// Hook
		this.inter.targets.pipe(
			filter(entries => {
				const index = entries.map(entry => entry.target).indexOf(elem);
				return !(index === -1 || !entries[index].isIntersecting);
			}),
			take(1), takeUntil(this._ngUnsub)
		).subscribe(() => {
			// Load our lazy target
			this._unobserved = true;
			this.inter.unobserve(elem);
			this.load();
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
