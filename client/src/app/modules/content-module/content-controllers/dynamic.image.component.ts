import { Component, Renderer2, ElementRef, Optional, ChangeDetectionStrategy, ViewChild, Inject, PLATFORM_ID } from '@angular/core';

import { DynamicComponent } from '@app/models';

import { ModalService } from '@app/services/utility/modal.service';
import { IntersectionService } from '@app/services/utility/intersection.service';
import { MobileService } from '@app/services/utility/mobile.service';
import { ServerService } from '@app/services/http/server.service';


import { DynamicLazyLoader } from './dynamic.lazy.loader';

import { takeUntil } from 'rxjs/operators';
import { isPlatformServer } from '@angular/common';

interface PictureSource {
	src: string;
	media: string;
}

@Component({
	selector: 'image-container',
	template: `<figure><ng-content></ng-content></figure>`,
	styles: ['figure { margin: 0; }'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicImageComponent extends DynamicLazyLoader implements DynamicComponent {
	private _srcset: string;
	private _imgEl: HTMLImageElement;
	private readonly _sources: PictureSource[] = [];
	private readonly _isServer: boolean;

	constructor(
		private elRef: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2,
		private mobileService: MobileService,
		@Inject(PLATFORM_ID) private platformId: Object,
		@Optional() private modalService: ModalService) {

		super(elRef, inters);
		this._isServer = isPlatformServer(platformId);
	}

	buildJob(): void {
		this._imgEl = this.elRef.nativeElement.querySelector('img');
		const src = this._imgEl.attributes['data-src'].nodeValue;
		this.renderer.removeAttribute(this._imgEl, 'data-src');

		// Add lazy tag
		this.renderer.addClass(this.elRef.nativeElement, 'lazy');

		// check for CDN logic
		const output = /ucarecdn.com\/([A-Z0-9-]+)\//i.exec(src);
		if (output) {
			// Build our CDN image url string
			const cdnstring = 'https://ucarecdn.com/' + output[1] + '/-/format/auto/';
			// Add sources
			if (this._isServer) {
				 // small image for server side. We want the SPA to load asap.
				this._sources.push({ media: null, src: cdnstring + '-/resize/500x/' });
			} else {
				this._sources.push({ media: '1500w', src: cdnstring });
				this._sources.push({ media: '1000w', src: cdnstring + '-/resize/1000x/' });
				this._sources.push({ media: '750w', src: cdnstring + '-/resize/750x/' });
				this._sources.push({ media: '500w', src: cdnstring + '-/resize/500x/' });
			}
		} else {
			// If the image is not from the CDN, push just the src we found with no additional info to a srcset
			this._sources.push({ media: null, src: src });
		}

		this._srcset = this._sources.map((s) => `${s.src} ${(s.media ? s.media : '')}`).join(', ');
		this.renderer.listen(this._imgEl, 'click', this.onclick.bind(this));

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
