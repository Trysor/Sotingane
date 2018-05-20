import {
	Component, Input, AfterViewInit, OnDestroy, DoCheck, ChangeDetectionStrategy,
	ViewChild, ElementRef, Optional, Inject, PLATFORM_ID
} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { isPlatformServer } from '@angular/common';

import { CMSService, AuthService, ModalService, ContentService } from '@app/services';
import { CmsContent, AccessRoles } from '@app/models';

import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
	selector: 'content-component',
	templateUrl: './content.component.html',
	styleUrls: ['./content.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentComponent implements AfterViewInit, OnDestroy, DoCheck {
	// Content
	public readonly contentSubject = new BehaviorSubject<CmsContent>(null);
	@ViewChild('contentHost') private _contentHost: ElementRef<HTMLDivElement>;

	// Input content. Used in relation to Editing previews
	private _inputSet = false;
	@Input() public set contentInput(value: CmsContent) {
		if (this._inputSet) { return; }
		this.contentSubject.next(value);
		this._inputSet = true;
	}
	// previewMode controls the visiblity state of details in the template
	@Input() public previewMode = false;

	// Template Helpers
	public readonly AccessRoles = AccessRoles;
	public readonly isPlatformServer: boolean;

	// Code helpers
	private readonly _ngUnsub = new Subject();
	private readonly _failedToLoad: CmsContent = {
		access: AccessRoles.everyone,
		title: 'Page not available',
		content: 'Uhm. There appears to be nothing here. Sorry.',
		description: '404 - Not found',
		version: 0,
		route: '',
	};

	private readonly _serverLoading: CmsContent = {
		access: AccessRoles.everyone,
		title: ' ',
		content: ' ',
		description: ' ',
		version: 0,
		route: '',
	};

	// Constructor
	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Optional() private modalService: ModalService,
		private contentService: ContentService,
		private route: ActivatedRoute,
		private router: Router,
		public authService: AuthService,
		public cmsService: CMSService) {

		this.isPlatformServer = isPlatformServer(platformId);

		// Only after the above we ought to check our content
		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => {
			if (e instanceof NavigationEnd) { this.queryForData(); }
		});
	}

	ngAfterViewInit() {
		this.contentSubject.pipe(takeUntil(this._ngUnsub)).subscribe(content => {
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
	 * Internal helper to query for data
	 */
	private queryForData() {
		// Request content
		this.cmsService.requestContent(this.route.snapshot.params['content']).subscribe(
			content => this.contentSubject.next(content),					// Success
			(err: HttpErrorResponse) => {
				this.contentSubject.next(									// Error / Unauthorized
					err && err.status === 401 && this.isPlatformServer
						? this._serverLoading
						: this._failedToLoad
				);
			}
		);
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
		this.modalService.openDeleteContentModal(content).afterClosed().subscribe(doDelete => {
			if (!doDelete) { return; }

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
