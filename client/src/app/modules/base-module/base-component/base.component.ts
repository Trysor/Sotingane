import { Component, OnInit, OnDestroy, Optional, Inject, PLATFORM_ID, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry, MatDrawer } from '@angular/material';
import { Router } from '@angular/router';
import { isPlatformServer } from '@angular/common';

import { MobileService, AuthService, ContentService, WorkerService, ServerService, SEOService } from '@app/services';
// import { RoutingAnim } from '@app/animations';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'base-component',
	// animations: [RoutingAnim],
	templateUrl: './base.component.html',
	styleUrls: ['./base.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseComponent implements OnInit, OnDestroy {
	private _ngUnsub = new Subject();
	@ViewChild('sidenavLeft') private sidenavLeft: MatDrawer;
	@ViewChild('sidenavRight') private sidenavRight: MatDrawer;

	constructor(
		@Inject(PLATFORM_ID) private platformId: Object,
		@Optional() private workerService: WorkerService,
		@Optional() public serverService: ServerService,
		private contentService: ContentService,
		public seoService: SEOService,
		public mobileService: MobileService,
		public authService: AuthService,
		public router: Router,
		private iconRegistry: MatIconRegistry,
		private san: DomSanitizer) {

		// Registers the logo
		let logoPath = '/assets/logo192themed.svg';
		if (isPlatformServer(platformId)) { logoPath = serverService.urlBase + logoPath; }
		iconRegistry.addSvgIcon('logo', san.bypassSecurityTrustResourceUrl(logoPath));

		// Sets default metadata
		contentService.setDefaultMeta();
	}

	ngOnInit() {
		this.mobileService.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe(isMobile => {
			if (!isMobile) { this.closeSideNavs(); }
		});
		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => {
			this.closeSideNavs();
		});
	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}

	/**
	 * Closes the Mobile navigation sidepanels
	 */
	closeSideNavs() {
		this.sidenavLeft.close();
		this.sidenavRight.close();
	}

	/**
	 * Toggles the left navigation sidepanel
	 */
	toggleLeftNav() {
		this.sidenavLeft.toggle();
		this.sidenavRight.close();
	}

	/**
	 * Toggles the right navigation sidepanel
	 */
	toggleRightNav() {
		this.sidenavLeft.close();
		this.sidenavRight.toggle();
	}
}
