import { Component, Renderer2, ElementRef, ChangeDetectionStrategy, Input } from '@angular/core';

import { DynamicComponent } from '@types';

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

@Component({
	selector: 'dynamic-media',
	template: `<div></div>`, // element gets removed from DOM
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicMediaComponent extends DynamicLazyLoader implements DynamicComponent {
	private static readonly VideoFilters: VideoFilter[] = [
		{
			site: VideoSite.youtube,
			match: 'youtu.be',
			idFrom: /be\/([a-zA-Z0-9_-]+)/,
			start: /[\&\?]t=([0-9]+)/
		},
		{
			site: VideoSite.youtube,
			match: 'youtube',
			idFrom: /\?v=([a-zA-Z0-9_-]+)/,
			start: /[&?]t=([0-9]+)/
		},
		{
			site: VideoSite.twitch,
			match: 'twitch.tv/videos/',
			idFrom: /videos\/([a-zA-Z0-9_-]+)/,
			start: /[&?]t=([0-9]+)/, // t=04h30m37s. TODO: fix me.
			prefix: 'video=v'
		},
		{
			site: VideoSite.twitch,
			match: 'twitch.tv/',
			idFrom: /tv\/([a-zA-Z0-9_-]+)/,
			start: /[&?]t=([0-9]+)/,  // t=04h30m37s. TODO: fix me.
			prefix: 'channel='
		}
	];


	@Input() url: string;

	private _iframe: HTMLElement;
	private _img: HTMLElement;
	private readonly _listeners: (() => void)[] = [];

	constructor(
		private platform: PlatformService,
		private elRef: ElementRef<HTMLElement>,
		private inters: IntersectionService,
		private renderer: Renderer2) {

		super(elRef, inters);
	}

	/**
	 * DynamicComponent interface method. Triggered as the component is injected
	 */
	public buildJob(el: Element): void {
		this.url = el.children[0].getAttribute('url');

		// Protect against template issues
		if (!this.elRef.nativeElement.parentNode) { return; }
		if (!this.url) { return; }

		// Create video instances
		let foundMatch = false;
		for (const filter of DynamicMediaComponent.VideoFilters) {
			// Is current filter a match? if not, continue.
			if (!this.url.includes(filter.match)) { continue; }

			// entire match, grouping, index, entire input
			const match = filter.idFrom.exec(this.url);
			const ID = match ? match[1] : undefined;
			if (!ID) { break; }

			const params: VideoParams = { ID };
			const startMatch = filter.start.exec(this.url);
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
			return;
		}

		// Create the wrapper
		const wrapper: HTMLElement = this.renderer.createElement('figure');
		this.renderer.addClass(wrapper, 'media');

		// Add lazy tag
		if (this.platform.isBrowser) {
			this.renderer.addClass(this._iframe, 'iframelazy');
			this.renderer.addClass(wrapper, 'lazy');
		}
		this._listeners.push(
			this.renderer.listen(this._img, 'load', () => this.renderer.removeClass(wrapper, 'lazy'))
		);

		// Set common attributes
		this.renderer.setAttribute(this._iframe, 'frameBorder', '0');
		this.renderer.setAttribute(this._iframe, 'allowfullscreen', 'allowfullscreen');
		this.renderer.setAttribute(this._iframe, 'scrolling', 'no');

		// Add to DOM
		this.renderer.appendChild(wrapper, this._img);
		this.renderer.appendChild(wrapper, this._iframe);
		const parent = this.renderer.parentNode(this.elRef.nativeElement);

		this.renderer.insertBefore(parent, wrapper, this.elRef.nativeElement);
		this.renderer.removeChild(parent, this.elRef.nativeElement);
		this.renderer.destroy();

		this.hookLazyLoader(wrapper);
	}


	/**
	 * DynamicLazyLoader abstract method override. Triggered when the lazyloader loads.
	 */
	load() {
		this.renderer.setAttribute(this._iframe, 'src', this._iframe.getAttribute('data-src'));
		this.renderer.removeAttribute(this._iframe, 'data-src');

		this._listeners.push(
			this.renderer.listen(this._iframe, 'load', () => this.renderer.removeClass(this._iframe, 'iframelazy'))
		);
	}

	unload() {
		this._listeners.forEach(dispose => dispose());
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
