import { Component, Renderer2, ElementRef, Optional, ChangeDetectionStrategy } from '@angular/core';

import { DynamicComponent } from '@app/models';

import { ModalService } from '@app/services/utility/modal.service';
import { IntersectionService } from '@app/services/utility/intersection.service';
import { MobileService } from '@app/services/utility/mobile.service';

import { DynamicLazyLoader } from './dynamic.lazy.loader';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'image-container',
	template: `<ng-content></ng-content>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicImageComponent extends DynamicLazyLoader implements DynamicComponent {

	constructor(
		private el: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2,
		private mobileService: MobileService,
		@Optional() private modalService: ModalService) {

		super(inters);
		super.init(this.el.nativeElement);
	}

	buildJob(el: Element): void {
		const img = this.el.nativeElement.querySelector('img');
		if (!img) { return; }

		const src = img.getAttribute('src');
		img.removeAttribute('src');

		this.renderer.addClass(this.el.nativeElement, 'lazy');
		this.renderer.setAttribute(this.el.nativeElement, 'data-src', src);
	}

	load() {
		const img = this.el.nativeElement.querySelector('img');
		if (!img) { return; }

		this.renderer.setAttribute(img, 'src', this.el.nativeElement.getAttribute('data-src'));
		img.onload = () => {
			this.renderer.removeClass(this.el.nativeElement, 'lazy');

			if (!this.modalService) { return; }

			// No point doing this if the image never loads.
			const clickHandler = () => this.modalService.openImageModal({ src: img.src, alt: img.alt });
			let removeClickHandler: () => void;

			this.mobileService.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe((isMobile) => {
				if (isMobile) {
					if (removeClickHandler) { removeClickHandler(); }
					this.renderer.removeClass(img, 'click');
				} else {
					removeClickHandler = this.renderer.listen(img, 'click', clickHandler);
					this.renderer.addClass(img, 'click');
				}
			});
		};
	}
}
