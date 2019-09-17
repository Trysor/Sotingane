import { Injectable, ElementRef, Injector, ComponentRef, ComponentFactory, ComponentFactoryResolver } from '@angular/core';

import { Content, DynamicComponent } from '@types';

import { DynamicLinkComponent } from '@app/modules/content-module/content-controllers/dynamic.link.component';
import { DynamicImageComponent } from '@app/modules/content-module/content-controllers/dynamic.image.component';
import { DynamicMediaComponent } from '@app/modules/content-module/content-controllers/dynamic.media.component';


@Injectable({ providedIn: 'root' })
export class ContentService {
	private readonly _dynamicContent = new Map<string, ComponentFactory<DynamicComponent>>();
	private readonly _embeddedComponents: ComponentRef<DynamicComponent>[] = [];

	constructor(
		private resolver: ComponentFactoryResolver,
		private injector: Injector) {

		// Map the tag to replace with the corresponding factory
		this._dynamicContent.set('a', this.resolver.resolveComponentFactory(DynamicLinkComponent));
		this._dynamicContent.set('figure.media', this.resolver.resolveComponentFactory(DynamicMediaComponent));
		this._dynamicContent.set('figure.image', this.resolver.resolveComponentFactory(DynamicImageComponent));
	}

	// ---------------------------------------
	// ----------- CONTENT METHODS -----------
	// ---------------------------------------

	/**
	 * Builds the content for the given elementRef
	 */
	public buildContentForElement(element: ElementRef<HTMLDivElement>, content: Content) {
		// null ref checks
		if (!element || !element.nativeElement || !content || !content.content) {
			return;
		}

		// Prepare content for injection
		const e = element.nativeElement;

		// Clean components before rebuilding.
		this.cleanEmbeddedComponents();
		e.innerHTML = this.transformContentData(content.content);

		// Inject
		this._dynamicContent.forEach((fac, selector) => {
			// query for elements we need to adjust
			const elems = e.querySelectorAll(selector);

			for (let i = 0; i < elems.length; i++) {
				const el = elems.item(i);
				const origEl =  el.cloneNode(true) as Element;

				// convert NodeList into an array, since Angular dosen't like having a NodeList passed for projectableNodes
				const comp = fac.create(this.injector, [Array.prototype.slice.call(el.childNodes)], el);
				// only static ones work here since this is the only time they're set

				for (let j = 0; j < el.attributes.length; j++) {
					const attr = el.attributes.item(j);
					comp.instance[attr.name] = attr.value;
				}
				comp.instance.buildJob(origEl, content);

				// Add to list
				this._embeddedComponents.push(comp);
			}
		});
	}

	/**
	 * Destroys all embedded components
	 */
	public cleanEmbeddedComponents() {
		// destroycomponents to avoid be memory leaks
		this._embeddedComponents.forEach(comp => comp.destroy());
		this._embeddedComponents.length = 0;
	}


	private transformContentData(content: string) {
		return content.replace(/src=/g, 'data-src=').replace(/srcset=/g, 'data-srcset=');
	}
}
