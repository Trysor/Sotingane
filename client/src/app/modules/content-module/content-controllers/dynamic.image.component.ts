import { Component, Renderer2, ElementRef, ChangeDetectionStrategy } from '@angular/core';

import { DynamicComponent } from '@app/models';

import { IntersectionService } from '@app/services/utility/intersection.service';
import { DynamicLazyLoader } from './dynamic.lazy.loader';

@Component({
	selector: 'image-container',
	template: `<ng-content></ng-content>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicImageComponent extends DynamicLazyLoader implements DynamicComponent {

	constructor(
		private el: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2) {

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
		};
	}
}
