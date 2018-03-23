import {
	Component, Input, AfterViewInit, OnDestroy, DoCheck, Inject, PLATFORM_ID, ChangeDetectionStrategy,
	ComponentFactoryResolver, Injector, ComponentFactory, ViewChild, ElementRef, ComponentRef, Optional
} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { isPlatformServer } from '@angular/common';

import { CMSService, AuthService, ModalService, ServerService } from '@app/services';
import { CmsContent, AccessRoles, DynamicComponent } from '@app/models';

import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DynamicLinkComponent } from '../content-controllers/dynamic.link.component';
import { DynamicImageComponent } from '../content-controllers/dynamic.image.component';

@Component({
	selector: 'content-component',
	templateUrl: './content.component.html',
	styleUrls: ['./content.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentComponent implements AfterViewInit, OnDestroy, DoCheck {
	private _routingSub: Subscription;

	private _inputSet = false;
	@Input() public set contentInput(value: CmsContent) {
		if (this._inputSet) { return; }
		this.contentSubject.next(value);
		this._inputSet = true;
	}
	@Input() public previewMode = false; // used in the template

	public readonly AccessRoles = AccessRoles;
	public readonly contentSubject = new BehaviorSubject<CmsContent>(null);
	public isPlatformServer = false;
	public loading = false;

	private readonly _ngUnsub = new Subject();
	@ViewChild('contentHost') private _contentHost: ElementRef;
	private readonly _dynamicContent = new Map<string, ComponentFactory<DynamicComponent>>();
	private readonly _embeddedComponents: ComponentRef<DynamicComponent>[] = [];

	private readonly _failedToLoad: CmsContent = {
		access: AccessRoles.everyone,
		title: 'Page not available',
		content: 'Uhm. There appears to be nothing here. Sorry.',
		version: 0,
		route: '',
	};

	constructor(
		@Optional() private server: ServerService, // This service only exists in SSR
		@Inject(PLATFORM_ID) private platformId: Object,
		private modalService: ModalService,
		private resolver: ComponentFactoryResolver,
		private injector: Injector,
		private router: Router,
		private route: ActivatedRoute,
		public authService: AuthService,
		public cmsService: CMSService) {

		this.isPlatformServer = isPlatformServer(platformId);

		// Map the tag to replace with the corresponding factory
		this._dynamicContent.set('a', resolver.resolveComponentFactory(DynamicLinkComponent));
		this._dynamicContent.set('figure', resolver.resolveComponentFactory(DynamicImageComponent));

		// Only after the above we ought to check our content
		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => {
			if (e instanceof NavigationEnd) { this.queryForData(); }
		});
	}

	ngAfterViewInit() {
		this.contentSubject.pipe(takeUntil(this._ngUnsub)).subscribe(content => {
			this.build(content); // also cleans
			// Detect changes manually for each component.
			this._embeddedComponents.forEach(comp => comp.changeDetectorRef.detectChanges());
		});
	}

	ngOnDestroy() {
		this._routingSub.unsubscribe();

		this._ngUnsub.next();
		this._ngUnsub.complete();
		// Clean components
		this.cleanEmbeddedComponents();
	}

	ngDoCheck() {
		this._embeddedComponents.forEach(comp => comp.changeDetectorRef.detectChanges());
	}

	/**
	 * Internal helper to query for data
	 */
	private queryForData() {
		// Set loading flag
		this.loading = true;
		// Cancel any ongoing subscriptions
		if (this._routingSub && !this._routingSub.closed) { this._routingSub.unsubscribe(); }
		// Request content
		this._routingSub = this.cmsService.requestContent(this.route.snapshot.params['content']).subscribe(
			content => this.contentSubject.next(content),					// Success
			err => this.contentSubject.next(this._failedToLoad),			// Error
			() => { this._routingSub.unsubscribe(); this.loading = false; } // Request Completed, set loading false
		);
	}

	/**
	 * Inserts the content into DOM
	 * @param cmsContent
	 */
	private build(cmsContent: CmsContent) {
		// null ref checks
		if (!this._contentHost || !this._contentHost.nativeElement || !cmsContent || !cmsContent.content) {
			return;
		}

		// Prepare content for injection
		const e = (<HTMLElement>this._contentHost.nativeElement);
		let newContent = cmsContent.content;

		// inject directly if it is the server
		if (this.isPlatformServer && !!this.server) {
			e.innerHTML = this.server.modifyContent(newContent);
			return;
		}

		// Clean components before rebuilding.
		this.cleanEmbeddedComponents();

		// First loop; alter everything first, then inject afterwards.
		this._dynamicContent.forEach((fac, tag) => {
			const selector = fac.selector;
			const open = new RegExp(`<${tag} `, 'g');
			const close = new RegExp(`</${tag}>`, 'g');
			newContent = newContent.replace(open, `<${selector} `).replace(close, `</${selector}>`);
		});
		e.innerHTML = newContent;

		// Second loop; Injection time
		this._dynamicContent.forEach((fac) => {
			// query for elements we need to adjust
			const elems = e.querySelectorAll(fac.selector);

			for (let i = 0; i < elems.length; i++) {
				const el = elems.item(i);
				const savedTextContent = el.textContent; // save text content before we modify the element
				// convert NodeList into an array, since Angular dosen't like having a NodeList passed for projectableNodes
				const comp = fac.create(this.injector, [Array.prototype.slice.call(el.childNodes)], el);
				// only static ones work here since this is the only time they're set
				for (const attr of (el as any).attributes) {
					comp.instance[attr.nodeName] = attr.nodeValue;
				}
				// do buildJob
				comp.instance.buildJob(el, savedTextContent);

				this._embeddedComponents.push(comp);
			}
		});
	}

	private cleanEmbeddedComponents() {
		// destroycomponents to avoid be memory leaks
		this._embeddedComponents.forEach(comp => comp.destroy());
		this._embeddedComponents.length = 0;
	}

	/**
	 * Navigate the user to the editor page.
	 */
	public navigateToEditPage() {
		this.router.navigateByUrl('/compose/' + this.contentSubject.getValue().route);
	}

	/**
	 * Opens a modal asking the user to verify intent to delete the page they're viewing
	 */
	public deletePage() {
		const content = this.contentSubject.getValue();
		this.modalService.openDeleteContentModal(content).afterClosed().subscribe(result => {
			if (!result) { return; }

			const sub = this.cmsService.deleteContent(content.route).subscribe(
				() => {
					this.cmsService.getContentList(true);
					this.router.navigateByUrl('/');
					sub.unsubscribe();
				}
			);
		});
	}
}
