import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry, MatDrawer } from '@angular/material';
import { Router, ActivationStart, ActivationEnd } from '@angular/router';

import { MobileService, AuthService, WorkerService } from '@app/services';
// import { RoutingAnim } from '@app/animations';

import { Subject } from 'rxjs/Subject';
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

	public routerSub = new Subject<string>();


	constructor(
		public mobileService: MobileService,
		public authService: AuthService,
		public router: Router,
		private workerService: WorkerService,
		private iconRegistry: MatIconRegistry,
		private san: DomSanitizer) {
		// Register logo
		iconRegistry.addSvgIcon('logo', san.bypassSecurityTrustResourceUrl('assets/logo192themed.svg'));
	}

	ngOnInit() {
		this.mobileService.isMobile().pipe(takeUntil(this._ngUnsub)).subscribe(isMobile => {
			if (!isMobile) { this.closeSideNavs(); }
		});
		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => {
			this.closeSideNavs();

			if (e instanceof ActivationStart) {
				this.routerSub.next('start');
			} else if (e instanceof ActivationEnd) {
				this.routerSub.next('end');
			}
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

	toggleLeftNav() {
		this.sidenavLeft.toggle();
		this.sidenavRight.close();
	}

	toggleRightNav() {
		this.sidenavLeft.close();
		this.sidenavRight.toggle();
	}
}
