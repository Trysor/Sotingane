﻿import { Injectable, ElementRef, Optional, Injector, ComponentRef, ComponentFactory, ComponentFactoryResolver } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { env } from '@env';
import { ServerService } from '@app/services/http/server.service';
import { SettingsService } from '@app/services/controllers/settings.service';

import { CmsContent, DynamicComponent } from '@app/models';

import { DynamicLinkComponent } from '@app/modules/content-module/content-controllers/dynamic.link.component';
import { DynamicImageComponent } from '@app/modules/content-module/content-controllers/dynamic.image.component';


@Injectable({ providedIn: 'root' })
export class ContentService {
	private readonly _dynamicContent = new Map<string, ComponentFactory<DynamicComponent>>();
	private readonly _embeddedComponents: ComponentRef<DynamicComponent>[] = [];

	constructor(
		@Optional() private server: ServerService, // This service only exists in SSR
		private settingsService: SettingsService,
		private resolver: ComponentFactoryResolver,
		private injector: Injector,
		private title: Title,
		private meta: Meta) {

		// Map the tag to replace with the corresponding factory
		this._dynamicContent.set('a', resolver.resolveComponentFactory(DynamicLinkComponent));
		this._dynamicContent.set('figure', resolver.resolveComponentFactory(DynamicImageComponent));
	}

	// ---------------------------------------
	// ---------- META DATA METHODS ----------
	// ---------------------------------------

	/**
	 * Sets metadata to the default values provided in the environment variables
	 */
	public setDefaultMeta() {
		this.title.setTitle(this.settingsService.settings.getValue().meta.title);
		this.meta.updateTag({ name: 'description', content: this.settingsService.settings.getValue().meta.desc });
	}


	/**
	 * Sets metadata based on content
	 * @param cmsContent
	 */
	public setContentMeta(cmsContent: CmsContent) {
		this.meta.updateTag({ name: 'description', content: cmsContent.description });
		this.title.setTitle(`${this.settingsService.settings.getValue().meta.title} - ${cmsContent.title}`);
	}


	// ---------------------------------------
	// ----------- CONTENT METHODS -----------
	// ---------------------------------------

	/**
	 * Builds the content for the given elementRef
	 * @param element
	 * @param cmsContent
	 */
	public buildContentForElement(element: ElementRef<HTMLDivElement>, cmsContent: CmsContent) {
		// null ref checks
		if (!element || !element.nativeElement || !cmsContent || !cmsContent.content) {
			return;
		}

		// Prepare content for injection
		const e = element.nativeElement;
		let newContent = cmsContent.content;

		// Clean components before rebuilding.
		this.cleanEmbeddedComponents();

		// First loop; alter everything first, then inject afterwards.
		this._dynamicContent.forEach((fac, tag) => {
			const selector = fac.selector;
			const open = new RegExp(`<${tag} `, 'g');
			const close = new RegExp(`</${tag}>`, 'g');
			newContent = newContent.replace(open, `<${selector} `).replace(close, `</${selector}>`);
		});
		e.innerHTML = newContent.replace(/src/g, 'data-src');

		// Second loop; Injection time
		this._dynamicContent.forEach((fac) => {
			// query for elements we need to adjust
			const elems = e.querySelectorAll(fac.selector);

			for (let i = 0; i < elems.length; i++) {
				const el = elems.item(i);
				const origEl = el.cloneNode(true);
				const savedTextContent = el.textContent; // save text content before we modify the element
				// convert NodeList into an array, since Angular dosen't like having a NodeList passed for projectableNodes
				const comp = fac.create(this.injector, [Array.prototype.slice.call(el.childNodes)], el);
				// only static ones work here since this is the only time they're set

				for (let j = 0; j < el.attributes.length; j++) {
					const attr = el.attributes.item(j);
					comp.instance[attr.name] = attr.value;
				}
				comp.instance.buildJob(<Element>origEl, savedTextContent);

				// Add to list
				this._embeddedComponents.push(comp);
			}
		});
	}

	/**
	 * Detects changes and refreshes the components that have been injected
	 */
	public detectChanges() {
		this._embeddedComponents.forEach(comp => comp.changeDetectorRef.detectChanges());
	}

	/**
	 * Destroys all embedded components
	 */
	public cleanEmbeddedComponents() {
		// destroycomponents to avoid be memory leaks
		this._embeddedComponents.forEach(comp => comp.destroy());
		this._embeddedComponents.length = 0;
	}
}
