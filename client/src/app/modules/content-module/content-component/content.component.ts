import {
	Component, AfterViewInit, OnDestroy, ChangeDetectionStrategy,
	ViewChild, ElementRef, Optional
} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { CMSService, AuthService, ModalService, ContentService, SettingsService } from '@app/services';
import { AccessRoles } from '@types';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';


@Component({
	selector: 'content-component',
	templateUrl: './content.component.html',
	styleUrls: ['./content.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentComponent implements AfterViewInit, OnDestroy {
	// Content
	@ViewChild('contentHost', { static: false }) private _contentHost: ElementRef<HTMLDivElement>;

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
			filter(e => e instanceof NavigationEnd), takeUntil(this._ngUnsub)
		).subscribe(e => {
			this.cmsService.requestContent(this.route.snapshot.params['content']);
		});
	}

	ngAfterViewInit() {
		this.cmsService.content.pipe(filter(c => !!c), takeUntil(this._ngUnsub)).subscribe(content => {
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

			this.cmsService.deleteContent(content.route).subscribe(() => {
				this.cmsService.getContentList(true);
				this.router.navigateByUrl('/');
			});
		});
	}
}
