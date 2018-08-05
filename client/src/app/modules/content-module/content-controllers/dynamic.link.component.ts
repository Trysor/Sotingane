import { Component, OnInit, Input, Renderer2, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { DynamicComponent } from '@app/models';

import { PlatformService } from '@app/services/utility/platform.service';
import { IntersectionService } from '@app/services/utility/intersection.service';
import { DynamicLazyLoader } from './dynamic.lazy.loader';

interface VideoFilter {
	site: VideoSite;
	match: string;
	idFrom: RegExp;
	start: RegExp;
	prefix?: string;
}
interface VideoParams {
	ID: string;
	start?: string;
	prefix?: string;
}

enum VideoSite {
	twitch,
	youtube
}

type VideoFunction = (parameters: VideoParams) => void;


@Component({
	selector: 'router-link',
	template: `
		<ng-container *ngIf="!isVideo; else video;" [ngSwitch]="isRemoteUrl">
			<a *ngSwitchCase="true" [href]="link" [ngStyle]="style">{{text}}</a>
			<a *ngSwitchCase="false" [routerLink]="link" [ngStyle]="style">{{text}}</a>
		</ng-container>
		<ng-template #video>
			<div #videoHost></div>
		</ng-template>`,
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicLinkComponent extends DynamicLazyLoader implements DynamicComponent, OnInit {
	private static readonly VideoFilters: VideoFilter[] = [
		{
			'site': VideoSite.youtube,
			'match': 'youtu.be',
			'idFrom': /be\/([a-zA-Z0-9_-]+)/,
			'start': /[\&\?]t=([0-9]+)/
		},
		{
			'site': VideoSite.youtube,
			'match': 'youtube',
			'idFrom': /\?v=([a-zA-Z0-9_-]+)/,
			'start': /[&?]t=([0-9]+)/
		},
		{
			'site': VideoSite.twitch,
			'match': 'twitch.tv/videos/',
			'idFrom': /videos\/([a-zA-Z0-9_-]+)/,
			'start': /[&?]t=([0-9]+)/, // t=04h30m37s. TODO: fix me.
			'prefix': 'video=v'
		},
		{
			'site': VideoSite.twitch,
			'match': 'twitch.tv/',
			'idFrom': /tv\/([a-zA-Z0-9_-]+)/,
			'start': /[&?]t=([0-9]+)/,  // t=04h30m37s. TODO: fix me.
			'prefix': 'channel='
		}
	];


	@Input() link: string;
	@Input() text: string;

	public get isRemoteUrl(): boolean { return this._isRemoteUrl; }
	public get isVideo(): boolean { return this._isVideo; }

	private _isRemoteUrl = true;
	private _isVideo = false;
	private _iframe: HTMLElement;
	private _img: HTMLElement;

	constructor(
		private platform: PlatformService,
		private elRef: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2,
		private san: DomSanitizer) {

		super(elRef, inters);
	}

	ngOnInit() {
		// Protect against template issues
		if (!this.elRef.nativeElement.parentNode) { return; }

		if (this.platform.document) {
			const origin = this.platform.document.location.origin;
			if (this.link.startsWith('/') || this.link.startsWith(origin)) {
				this.link = this.link.replace(origin, '');
				this._isRemoteUrl = false;
			}
		}

		// Create video instances
		const url = this.link;
		let foundMatch = false;
		for (const filter of DynamicLinkComponent.VideoFilters) {
			// Is current filter a match? if not, continue.
			if (!url.includes(filter.match)) { continue; }

			// entire match, grouping, index, entire input
			const match = filter.idFrom.exec(url);
			const ID = match ? match[1] : undefined;
			if (!ID) { break; }

			const params: VideoParams = { 'ID': ID };
			const startMatch = filter.start.exec(url);
			if (startMatch) { params.start = startMatch[1]; }
			if (filter.prefix) { params.prefix = filter.prefix; }

			switch (filter.site) {
				case VideoSite.youtube:
					this.createYoutubeVideo(params);
					break;
				case VideoSite.twitch:
					this.createTwitchVideo(params);
					break;
			}
			foundMatch = true;
			break;
		}
		if (!foundMatch) {
			this._isVideo = false;
			return;
		}
		this._isVideo = true;

		// Create the wrapper
		const wrapper: HTMLDivElement = this.renderer.createElement('div');
		this.renderer.addClass(wrapper, 'video');

		// Add lazy tag
		if (this.platform.isBrowser) {
			this.renderer.addClass(this._iframe, 'iframelazy');
			this.renderer.addClass(wrapper, 'lazy');
		}
		this.renderer.listen(this._img, 'load', () => this.renderer.removeClass(wrapper, 'lazy'));


		// Set common attributes
		this.renderer.setAttribute(this._iframe, 'frameBorder', '0');
		this.renderer.setAttribute(this._iframe, 'allowfullscreen', 'allowfullscreen');
		this.renderer.setAttribute(this._iframe, 'scrolling', 'no');

		// Add to DOM
		this.renderer.appendChild(wrapper, this._img);
		this.renderer.appendChild(wrapper, this._iframe);
		const parent = this.renderer.parentNode(this.elRef.nativeElement);
		const parentParent = this.renderer.parentNode(parent);
		this.renderer.insertBefore(parentParent, wrapper, parent);
		this.renderer.removeChild(parent, this.elRef.nativeElement);
		this.renderer.destroy();

		this.hookLazyLoader(wrapper);
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
		this.renderer.listen(this._iframe, 'load', () => this.renderer.removeClass(this._iframe, 'iframelazy'));
	}

	/**
	 * Creates a youtube embed
	 */
	private createYoutubeVideo(p: VideoParams) {
		let startTime = '';
		if (p.start) { startTime = '?start=' + p.start; }
		const url = 'https://www.youtube.com/embed/' + p.ID + startTime + `${p.start ? '&' : '?'}rel=0`;

		// Create iframe
		this._iframe = this.renderer.createElement('iframe');
		this.renderer.setAttribute(this._iframe, 'data-src', url);
		this.renderer.setAttribute(this._iframe, 'title', 'Youtube - ' + url);

		// Create Thumbnail image (also required for aspect ratio)
		this._img = this.renderer.createElement('img');
		this.renderer.setAttribute(this._img, 'alt', 'Youtube thumbnail');
		this.renderer.setAttribute(this._img, 'src', 'https://img.youtube.com/vi/' + p.ID + '/mqdefault.jpg');
	}

	/**
	 * Creates a Twitch embed
	 */
	private createTwitchVideo(p: VideoParams) {
		const url = 'https://player.twitch.tv/?' + p.prefix + p.ID;

		// Create iframe
		this._iframe = this.renderer.createElement('iframe');
		this.renderer.setAttribute(this._iframe, 'data-src', url);
		this.renderer.setAttribute(this._iframe, 'title', 'Twitch - ' + url);

		// Create Thumbnail image (also required for aspect ratio)
		this._img = this.renderer.createElement('img');  // Creating a black 16 by 9 base64 image
		this.renderer.setAttribute(this._img, 'alt', 'Twitch thumbnail');
		this.renderer.setAttribute(this._img, 'src',
			'data:image/bmp;base64,Qk1YAQAAAAAAADYAAAAoAAAAEAAAAAkAAAABABAAAAAAACIBAAASCwAAEgs' + 'A'.repeat(400) + '=');
	}
}
