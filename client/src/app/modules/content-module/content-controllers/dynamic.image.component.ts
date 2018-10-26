import { Component, Renderer2, ElementRef, Optional, ChangeDetectionStrategy } from '@angular/core';

import { DynamicComponent } from '@types';
import { ModalService } from '@app/services/utility/modal.service';
import { IntersectionService } from '@app/services/utility/intersection.service';
import { MobileService } from '@app/services/utility/mobile.service';
import { PlatformService } from '@app/services/utility/platform.service';


import { DynamicLazyLoader } from './dynamic.lazy.loader';

import { takeUntil } from 'rxjs/operators';

interface PictureSource {
	src: string;
	media: string;
}

@Component({
	selector: 'image-container',
	template: `<ng-content></ng-content>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicImageComponent extends DynamicLazyLoader implements DynamicComponent {
	private _srcset: string;
	private _imgEl: HTMLImageElement;
	private readonly _sources: PictureSource[] = [];

	constructor(
		private elRef: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2,
		private mobileService: MobileService,
		private platform: PlatformService,
		@Optional() private modalService: ModalService) {

		super(elRef, inters);
	}

	buildJob(): void {
		this._imgEl = this.elRef.nativeElement.querySelector('img');
		const src = this._imgEl.attributes['data-src'].nodeValue;
		this.renderer.removeAttribute(this._imgEl, 'data-src');

		// Add lazy tag
		if (this.platform.isBrowser) { this.renderer.addClass(this.elRef.nativeElement, 'lazy'); }

		this._sources.push({ media: null, src: src });

		this._srcset = this._sources.map((s) => `${s.src} ${(s.media ? s.media : '')}`).join(', ');
		this.renderer.listen(this._imgEl, 'click', this.onclick.bind(this));

		this.mobileService.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe(isMobile => {
			if (isMobile) {
				this.renderer.removeClass(this._imgEl, 'click');
			} else {
				this.renderer.addClass(this._imgEl, 'click');
			}
		});

		if (this.platform.isServer) {
			this.load();
		} else {
			this.hookLazyLoader(this.elRef.nativeElement);
		}
	}

	load() {
		// Add the srcset
		this.renderer.setAttribute(this._imgEl, 'srcset', this._srcset);
		// Remove lazy tag
		this.renderer.listen(this._imgEl, 'load', () => this.renderer.removeClass(this.elRef.nativeElement, 'lazy'));
	}

	/**
	 * OnClick handler for the image. Opens a modal with the original-sized image
	 */
	onclick() {
		if (!this.modalService) { return; }
		if (this.mobileService.isMobile().getValue()) { return; }

		// this.sources[0] is auto-format original-sized image
		const altAttr = this._imgEl.attributes['alt'];
		this.modalService.openImageModal({ src: this._sources[0].src, alt: altAttr ? altAttr.nodeValue : '' });
	}
}
