import { Component, OnInit, Input, Inject, Renderer2, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { DOCUMENT } from '@angular/common';

import { DynamicComponent } from '@app/models';

import { IntersectionService } from '@app/services/utility/intersection.service';
import { DynamicLazyLoader } from './dynamic.lazy.loader';

enum TwitchType {
	Channel = 'channel',
	Video = 'video',
	Collection = 'collection'
}

@Component({
	selector: 'router-link',
	template: `
		<ng-container *ngIf="!isVideo; else video;" [ngSwitch]="isRemoteUrl">
			<a *ngSwitchCase="true" [href]="safeLink" [ngStyle]="style">{{text}}</a>
			<a *ngSwitchCase="false" [routerLink]="link" [ngStyle]="style">{{text}}</a>
		</ng-container>
		<ng-template #video>
			<div #videoHost></div>
		</ng-template>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicLinkComponent extends DynamicLazyLoader implements DynamicComponent, OnInit {
	@Input() link: string;
	@Input() text: string;

	public get isRemoteUrl(): boolean { return this._isRemoteUrl; }
	public get isVideo(): boolean { return this.link.includes('youtube') || this.link.includes('twitch'); }

	public get safeLink(): string | SafeUrl {
		if (this.link.startsWith('steam://')) {
			return this.san.bypassSecurityTrustUrl(this.link);
		}
		return this.link;
	}

	private _isRemoteUrl = true;
	private _iframe: HTMLElement;
	private _img: HTMLElement;

	constructor(
		@Inject(DOCUMENT) private document: Document,
		private el: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2,
		private san: DomSanitizer) {

		super(inters);
	}

	ngOnInit() {
		if (!this.document) { return; }
		const origin = this.document.location.origin;
		if (this.link.startsWith('/') || this.link.startsWith(origin)) {
			this.link = this.link.replace(origin, '');
			this._isRemoteUrl = false;
		}

		if (!this.isVideo) { return; }
		// Protect against template issues
		if (!this.el.nativeElement.parentNode) { return; }

		// Create video instances
		const url = this.link;
		if (url.includes('youtube')) {
			this.createYoutubeVideo();
		} else if (url.includes('twitch')) {
			this.createTwitchVideo();
		} else { return; } // Do nothing

		// Create the wrapper
		const wrapper = this.renderer.createElement('div');
		this.renderer.addClass(wrapper, 'video');

		// Set common attributes
		this.renderer.setAttribute(this._iframe, 'frameBorder', '0');
		this.renderer.setAttribute(this._iframe, 'allowfullscreen', 'allowfullscreen');
		this.renderer.setAttribute(this._iframe, 'scrolling', 'no');

		// Add to DOM
		this.renderer.appendChild(wrapper, this._img);
		this.renderer.appendChild(wrapper, this._iframe);
		this.renderer.insertBefore(this.el.nativeElement.parentElement, wrapper, this.el.nativeElement);
		this.renderer.removeChild(this.renderer.parentNode(this.el.nativeElement), this.el.nativeElement);
		this.renderer.destroy();

		// Init with the lazy-loader
		super.init(wrapper);
	}

	/**
	 * DynamicComponent interface method. Triggered as the component is injected
	 * @param el
	 * @param textContent
	 */
	public buildJob(el: Element, textContent: string): void {
		this.link = el.getAttribute('href');
		this.text = textContent;
	}


	/**
	 * DynamicLazyLoader abstract method override. Triggered when the lazyloader loads.
	 */
	load() {
		this.renderer.setAttribute(this._iframe, 'src', this._iframe.getAttribute('data-src'));
		this.renderer.removeAttribute(this._iframe, 'data-src');
	}

	/**
	 * Creates a youtube embed
	 */
	private createYoutubeVideo() {
		const split = this.link.split('v=');
		if (!split[0] || !split[1]) { return; }

		// Get vars
		const videoId = split[1].split('&')[0];

		// Create iframe
		this._iframe = this.renderer.createElement('iframe');
		this.renderer.setAttribute(this._iframe, 'data-src', 'https://www.youtube.com/embed/' + videoId);

		// Create Thumbnail image (also required for aspect ratio)
		this._img = this.renderer.createElement('img');
		this.renderer.setAttribute(this._img, 'src', 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg');
	}

	/**
	 * Creates a Twitch embed
	 */
	private createTwitchVideo() {
		const url = this.link;
		let type = TwitchType.Video, prefix = '', source = '';

		if (url.includes('/videos/')) {
			prefix = 'v';
			source = url.split('/videos/')[1];
		} else {
			// assume its a channel
			type = TwitchType.Channel;
			source = url.split('.tv/')[1];
		}

		// Create iframe
		this._iframe = this.renderer.createElement('iframe');
		this.renderer.setAttribute(this._iframe, 'data-src', 'https://player.twitch.tv/?' + type + '=' + prefix + source);

		// Create Thumbnail image (also required for aspect ratio)
		this._img = this.renderer.createElement('img');  // Creating a black 16 by 9 base64 image
		this.renderer.setAttribute(this._img, 'src',
			'data:image/bmp;base64,Qk1YAQAAAAAAADYAAAAoAAAAEAAAAAkAAAABABAAAAAAACIBAAASCwAAEgs' + 'A'.repeat(400) + '=');
	}
}
