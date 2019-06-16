import { OnDestroy, ElementRef } from '@angular/core';

import { IntersectionService } from '@app/services';

import { Subject } from 'rxjs';
import { takeUntil, take, filter } from 'rxjs/operators';


export abstract class DynamicLazyLoader implements OnDestroy {
	protected _ngUnsub = new Subject();
	private _observed = false;

	constructor(
		private el: ElementRef<HTMLElement>,
		private inter: IntersectionService) {
	}

	ngOnDestroy() {
		if (!this._ngUnsub.closed) {
			this._ngUnsub.next();
			this._ngUnsub.complete();
		}

		if (this.el && this.inter && this._observed) {
			this.inter.unobserve(this.el.nativeElement);
		}

		if (!!this.unload) { this.unload(); }
	}

	/**
	 * The initialization method for the lazy loader.
	 * @param elem the element to observe
	 */
	public hookLazyLoader(elem: HTMLElement) {
		// Hook
		this.inter.targets.pipe(
			filter(elements => elements.includes(elem)),
			takeUntil(this._ngUnsub)
		).subscribe(() => {
			this._ngUnsub.next();
			this._ngUnsub.complete();
			// Load our lazy target
			this._observed = false;
			this.inter.unobserve(elem);
			this.load();
		});

		// Start observing
		this._observed = true;
		this.inter.observe(elem);
	}

	/**
	 * Abstract load method; subclasses need to implement this.
	 * The method should contain code that completes the loading process.
	 */
	abstract load(): void;

	/**
	 * Abstract unload method; subclasses need to implement this.
	 * The method should contain code that disposes of unmanaged data.
	 */
	abstract unload(): void;
}
