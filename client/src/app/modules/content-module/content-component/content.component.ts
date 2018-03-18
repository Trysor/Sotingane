import {
	Component, Input, OnInit, AfterViewInit, OnDestroy, DoCheck, ChangeDetectionStrategy, ChangeDetectorRef,
	ComponentFactoryResolver, InjectionToken, Injector, ComponentFactory, ViewChild, ElementRef, ComponentRef
} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material';

import { CMSService, AuthService, ModalService } from '@app/services';
import { CmsContent, AccessRoles, DynamicComponent } from '@app/models';

import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { takeUntil } from 'rxjs/operators';

import { DynamicLinkComponent } from '../content-controllers/dynamic.link.component';
import { DynamicImageComponent } from '../content-controllers/dynamic.image.component';

@Component({
	selector: 'content-component',
	templateUrl: './content.component.html',
	styleUrls: ['./content.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentComponent implements OnInit, AfterViewInit, OnDestroy, DoCheck {
	private _inputSet = false;
	@Input() public set contentInput(value: CmsContent) {
		if (this._inputSet) { return; }
		this.contentSubject.next(value);
		this._inputSet = true;
	}
	@Input() public previewMode = false; // used in the template

	public readonly AccessRoles = AccessRoles;
	public readonly contentSubject = new BehaviorSubject<CmsContent>(null);

	private readonly _ngUnsub = new Subject();
	@ViewChild('contentHost') private _contentHost: ElementRef;
	private readonly _dynamicContent = new Map<string, ComponentFactory<DynamicComponent>>();
	private readonly _embeddedComponents: ComponentRef<DynamicComponent>[] = [];


	constructor(
		private modalService: ModalService,
		private resolver: ComponentFactoryResolver,
		private injector: Injector,
		private dialog: MatDialog,
		private router: Router,
		private route: ActivatedRoute,
		public authService: AuthService,
		public cmsService: CMSService) {

		// Map the tag to replace with the corresponding factory
		this._dynamicContent.set('a', resolver.resolveComponentFactory(DynamicLinkComponent));
		this._dynamicContent.set('figure', resolver.resolveComponentFactory(DynamicImageComponent));
	}

	ngOnInit() {
		// If the contentSubject already has a value, then that's great!
		if (!this.contentSubject.getValue()) {
			this.contentSubject.next(this.route.snapshot.data['CmsContent']);
		}

		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => {
			if (e instanceof NavigationEnd) {
				this.contentSubject.next(this.route.snapshot.data['CmsContent']);
			}
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
		this._ngUnsub.next();
		this._ngUnsub.complete();
		// Clean components
		this.cleanEmbeddedComponents();
	}

	ngDoCheck() {
		this._embeddedComponents.forEach(comp => comp.changeDetectorRef.detectChanges());
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
		// Clean components before rebuilding.
		this.cleanEmbeddedComponents();

		// Prepare content for injection
		const e = (<HTMLElement>this._contentHost.nativeElement);
		let newContent = cmsContent.content;

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
