import { Component, Renderer2, ElementRef, Optional, ChangeDetectionStrategy } from '@angular/core';

import { DynamicComponent, Content } from '@types';
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
	private _src: string;
	private _srcset: string;
	private _imgEl: HTMLImageElement;
	private readonly _listeners: (() => void)[] = [];

	private _content: Content;

	constructor(
		private elRef: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2,
		private mobileService: MobileService,
		private platform: PlatformService,
		@Optional() private modalService: ModalService) {

		super(elRef, inters);
	}

	buildJob(_el: Element, content: Content): void {
		this._content = content;

		this._imgEl = this.elRef.nativeElement.querySelector('img');
		if (!this._imgEl.attributes['data-src']) { return; }

		// Get image sources
		const src: string = this._imgEl.attributes['data-src'].nodeValue;
		this._src = src;
		this.renderer.removeAttribute(this._imgEl, 'data-src');

		if (this._imgEl.attributes['data-srcset']) {
			this._srcset = this._imgEl.attributes['data-srcset'].nodeValue;
			this.renderer.removeAttribute(this._imgEl, 'data-srcset');
		}

		// Force the image ratio
		const imageData = content.images && content.images.find(imgData => src === imgData.url);
		if (!!imageData) {
			const ratio = imageData.height / imageData.width;
			this.renderer.setStyle(this._imgEl, 'padding-bottom', `${ratio * 100}%`);
		}

		// Add lazy tag
		this.renderer.addClass(this.elRef.nativeElement, 'lazy');

		this._listeners.push(this.renderer.listen(this._imgEl, 'click', this.onclick.bind(this)));

		this.mobileService.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe(isMobile => {
			if (isMobile) {
				this.renderer.removeClass(this._imgEl, 'click');
			} else {
				this.renderer.addClass(this._imgEl, 'click');
			}
		});

		this.hookLazyLoader(this.elRef.nativeElement);
	}

	load() {
		// Add the srcset
		this.renderer.setAttribute(this._imgEl, 'src', this._src);
		if (!!this._srcset) {
			this.renderer.setAttribute(this._imgEl, 'srcset', this._srcset);
		}

		if (this._imgEl.complete) {
			this.onload();
			return;
		}

		this._listeners.push(this.renderer.listen(this._imgEl, 'load', this.onload.bind(this)));
		this._listeners.push(this.renderer.listen(this._imgEl, 'error', this.onerror.bind(this)));
	}

	unload() {
		this._listeners.forEach(dispose => dispose());
	}

	/**
	 * OnClick handler for the image. Opens a modal with the original-sized image
	 */
	onclick() {
		if (!this.modalService || this.mobileService.isMobile().getValue()) { return; }

		// this.sources[0] is auto-format original-sized image
		const altAttr = this._imgEl.attributes.getNamedItem('alt');
		this.modalService.openImageModal({
			startIndex: this._content.images.map(i => i.url).indexOf(this._src),
			images: this._content.images
		});
	}

	onload() {
		this.renderer.removeStyle(this._imgEl, 'padding-bottom');
		this.renderer.removeClass(this.elRef.nativeElement, 'lazy');
	}

	onerror() {
		this.renderer.removeClass(this.elRef.nativeElement, 'lazy');
		this.renderer.addClass(this.elRef.nativeElement, 'error');
	}
}
