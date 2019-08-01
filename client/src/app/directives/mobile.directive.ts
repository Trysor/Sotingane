import { Directive, Renderer2, ElementRef } from '@angular/core';

import { DestroyableClass } from '@app/classes';
import { MobileService } from '@app/services/utility/mobile.service';

import { takeUntil } from 'rxjs/operators';

@Directive({
	selector: '[appMobile]',
	exportAs: 'appMobile'
})
export class MobileDirective extends DestroyableClass {
	get isMobile() {
		return this.mobile.isMobile().asObservable();
	}

	constructor(private el: ElementRef, private renderer: Renderer2, private mobile: MobileService) {
		super();

		console.log('MOBILE DIRECTIVE INSTANTIATED', el);

		if (!el || !el.nativeElement.classList) { return; }
		this.mobile.isMobile().pipe(takeUntil(this.OnDestroy)).subscribe(isMobile => {
			if (isMobile) {
				this.renderer.addClass(this.el.nativeElement, 'mobile');
			} else {
				this.renderer.removeClass(this.el.nativeElement, 'mobile');
			}
		});
	}
}
