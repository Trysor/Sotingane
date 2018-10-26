import {
	Component, Input, AfterViewInit, OnDestroy, DoCheck, ChangeDetectionStrategy,
	ViewChild, ElementRef, Optional
} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { CMSService, AuthService, ModalService, ContentService, SettingsService } from '@app/services';
import { Content, AccessRoles } from '@types';

import { Subject } from 'rxjs';
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
	@Input() public set contentInput(value: Content) {
		if (!value) { return; }
		const old = this.cmsService.content.getValue();
		if (old && old.content === value.content && old.title === value.title) {
			return; // Visually the same as what we've got
		}
		this.cmsService.content.next(value);
	}
	// previewMode controls the visiblity state of details in the template
	@Input() public previewMode = false;

	// Template Helpers
	public readonly AccessRoles = AccessRoles;
	public readonly isPlatformServer: boolean;
	public get settings() { return this.settingsService.settings; }

	// Code helpers
	private readonly _ngUnsub = new Subject();

	// Constructor
	constructor(
		@Optional() private modalService: ModalService,
		private contentService: ContentService,
		private route: ActivatedRoute,
		private router: Router,
		public authService: AuthService,
		private settingsService: SettingsService,
		public cmsService: CMSService) {

		this.router.events.pipe(
			filter(e => e instanceof NavigationEnd),
			takeUntil(this._ngUnsub)
		).subscribe(e => {
			this.cmsService.requestContent(this.route.snapshot.params['content']);
		});
	}

	ngAfterViewInit() {
		this.cmsService.content.pipe(takeUntil(this._ngUnsub)).subscribe(content => {
			if (!content) { return; }
			this.contentService.buildContentForElement(this._contentHost, content); // Build content
		});
	}

	ngOnDestroy() {
		// Also unsubscribe from other observables
		this._ngUnsub.next();
		this._ngUnsub.complete();
		// Clean components
		this.contentService.cleanEmbeddedComponents();
		// We're no longer watching content
		this.cmsService.content.next(null);
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
