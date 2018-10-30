import { Directive, Input, Renderer2, ElementRef, OnDestroy } from '@angular/core';

import { MobileService } from '@app/services/utility/mobile.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
	selector: '[appMobile]',
	exportAs: 'mobile'
})
export class MobileDirective implements OnDestroy {
	private _ngUnsub = new Subject();

	get isMobile() {
		return this.mobile.isMobile();
	}

	constructor(private el: ElementRef, private renderer: Renderer2, private mobile: MobileService) {

		this.mobile.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe((isMobile) => {
			if (isMobile) {
				this.renderer.addClass(this.el.nativeElement, 'mobile');
			} else {
				this.renderer.removeClass(this.el.nativeElement, 'mobile');
			}
		});
	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}
}
