import { Injectable, Optional } from '@angular/core';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { ServerService } from '@app/services/server.service';

import { Subject, BehaviorSubject } from 'rxjs';

@Injectable()
export class MobileService {
	// Private fields
	private _isMobileSubject = new BehaviorSubject<boolean>(false);

	private readonly _mobileDevices = [
		Breakpoints.Handset,
		Breakpoints.Small,
		Breakpoints.TabletPortrait
	];

	public isMobile(): BehaviorSubject<boolean> { return this._isMobileSubject; }

	constructor(
		@Optional() private server: ServerService, // This service only exists in SSR
		private breakpointObserver: BreakpointObserver) {

		// Alternative method to get mobile, for server.
		if (!!server) { this._isMobileSubject.next(server.isMobile()); return; }

		// Handle Mobile devices
		if (breakpointObserver.isMatched(this._mobileDevices)) { this._isMobileSubject.next(true); }

		// Handle Mobile breakpoint change
		this.breakpointObserver.observe(this._mobileDevices).subscribe(result => {
			this._isMobileSubject.next(result.matches);
		});
	}
}
