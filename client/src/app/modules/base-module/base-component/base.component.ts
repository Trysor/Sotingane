import { Component, AfterViewInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { MatDrawer } from '@angular/material/sidenav';

import { AuthService } from '@app/services/controllers/auth.service';
import { MobileService } from '@app/services/utility/mobile.service';
import { SEOService } from '@app/services/utility/seo.service';

import { takeUntil } from 'rxjs/operators';
import { DestroyableClass } from '@app/classes';

@Component({
	selector: 'base-component',
	templateUrl: './base.component.html',
	styleUrls: ['./base.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseComponent extends DestroyableClass implements AfterViewInit {
	@ViewChild('sidenavLeft', { static: false }) private sidenavLeft: MatDrawer;
	@ViewChild('sidenavRight', { static: false }) private sidenavRight: MatDrawer;

	constructor(
		public seoService: SEOService,
		public mobileService: MobileService,
		public authService: AuthService,
		public router: Router) {

		super();
	}

	ngAfterViewInit() {
		this.mobileService.isMobile().pipe(takeUntil(this.OnDestroy)).subscribe(isMobile => {
			if (!isMobile) { this.closeSideNavs(); }
		});
		this.router.events.pipe(takeUntil(this.OnDestroy)).subscribe(() => { this.closeSideNavs(); });
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
