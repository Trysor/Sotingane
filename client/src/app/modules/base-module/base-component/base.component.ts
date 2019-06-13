import { Component, AfterViewInit, OnDestroy, Optional, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { MatDrawer } from '@app/modules/material.types';

import { MobileService, AuthService, WorkerService, ServerService, SEOService, SetupService } from '@app/services';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'base-component',
	templateUrl: './base.component.html',
	styleUrls: ['./base.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseComponent implements AfterViewInit, OnDestroy {
	private _ngUnsub = new Subject();
	@ViewChild('sidenavLeft', { static: false }) private sidenavLeft: MatDrawer;
	@ViewChild('sidenavRight', { static: false }) private sidenavRight: MatDrawer;

	constructor(
		@Optional() private workerService: WorkerService,
		@Optional() public serverService: ServerService,
		@Optional() public setupService: SetupService,
		public seoService: SEOService,
		public mobileService: MobileService,
		public authService: AuthService,
		public router: Router) {
	}

	ngAfterViewInit() {
		this.mobileService.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe(isMobile => {
			if (!isMobile) { this.closeSideNavs(); }
		});
		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(() => { this.closeSideNavs(); });
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
