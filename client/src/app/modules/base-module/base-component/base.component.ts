import { Component, OnInit, OnDestroy, Optional, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatDrawer } from '@angular/material';
import { Router } from '@angular/router';

import { MobileService, AuthService, ContentService, WorkerService, ServerService, SEOService } from '@app/services';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'base-component',
	templateUrl: './base.component.html',
	styleUrls: ['./base.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseComponent implements OnInit, OnDestroy {
	private _ngUnsub = new Subject();
	@ViewChild('sidenavLeft') private sidenavLeft: MatDrawer;
	@ViewChild('sidenavRight') private sidenavRight: MatDrawer;

	constructor(
		@Optional() private workerService: WorkerService,
		@Optional() public serverService: ServerService,
		private contentService: ContentService,
		public seoService: SEOService,
		public mobileService: MobileService,
		public authService: AuthService,
		public router: Router) {

		// Sets default metadata
		contentService.setDefaultMeta();
	}

	ngOnInit() {
		this.mobileService.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe(isMobile => {
			if (!isMobile) { this.closeSideNavs(); }
		});
		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => { this.closeSideNavs(); });
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
