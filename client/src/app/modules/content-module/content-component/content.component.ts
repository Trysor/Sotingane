import {
	Component, Input, AfterViewInit, OnDestroy, DoCheck, ChangeDetectionStrategy,
	ViewChild, ElementRef, Optional
} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { CMSService, AuthService, ModalService, ContentService } from '@app/services';
import { CmsContent, AccessRoles } from '@app/models';

import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';


@Component({
	selector: 'content-component',
	templateUrl: './content.component.html',
	styleUrls: ['./content.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentComponent implements AfterViewInit, OnDestroy, DoCheck {
	// Content
	@ViewChild('contentHost') private _contentHost: ElementRef<HTMLDivElement>;

	// Input content. Used in relation to Editing previews
	private _inputSet = false;
	@Input() public set contentInput(value: CmsContent) {
		if (this._inputSet) { return; }
		this.cmsService.content.next(value);
		this._inputSet = true;
	}
	// previewMode controls the visiblity state of details in the template
	@Input() public previewMode = false;

	// Template Helpers
	public readonly AccessRoles = AccessRoles;
	public readonly isPlatformServer: boolean;

	// Code helpers
	private readonly _ngUnsub = new Subject();

	// Constructor
	constructor(
		@Optional() private modalService: ModalService,
		private contentService: ContentService,
		private route: ActivatedRoute,
		private router: Router,
		public authService: AuthService,
		public cmsService: CMSService) {

		this.router.events.pipe(
			takeUntil(this._ngUnsub),
			filter(e => e instanceof NavigationEnd)
		).subscribe(e => {
			this.cmsService.requestContent(this.route.snapshot.params['content']);
		});
	}

	ngAfterViewInit() {
		this.cmsService.content.pipe(takeUntil(this._ngUnsub)).subscribe(content => {
			if (!content) { return; }

			// Set metadata
			this.contentService.setContentMeta(content);
			// Build content
			this.contentService.buildContentForElement(this._contentHost, content);
		});
	}

	ngOnDestroy() {
		// Also unsubscribe from other observables
		this._ngUnsub.next();
		this._ngUnsub.complete();
		// Clean components
		this.contentService.cleanEmbeddedComponents();
		// Set meta back to default
		this.contentService.setDefaultMeta();
	}

	ngDoCheck() {
		this.contentService.detectChanges();
	}

	/**
	 * Navigate the user to the editor page.
	 */
	public navigateToEditPage() {
		this.router.navigateByUrl('/compose/' + this.cmsService.content.getValue().route);
	}

	/**
	 * Opens a modal asking the user to verify intent to delete the page they're viewing
	 */
	public deletePage() {
		const content = this.cmsService.content.getValue();
		this.modalService.openDeleteContentModal(content).afterClosed().subscribe(doDelete => {
			if (!doDelete) { return; }

			this.cmsService.deleteContent(content.route).subscribe(
				() => {
					this.cmsService.getContentList(true);
					this.router.navigateByUrl('/');
				}
			);
		});
	}
}
