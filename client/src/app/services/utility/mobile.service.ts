import { Injectable, Optional } from '@angular/core';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ServerService } from '@app/services/http/server.service';
import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class MobileService {
	// Private fields
	private readonly _isMobileSubject = new BehaviorSubject<boolean>(false);

	private readonly _mobileDevices = [
		Breakpoints.Handset,
		Breakpoints.Small,
		Breakpoints.TabletPortrait
	];

	constructor(
		@Optional() private server: ServerService, // This service only exists in SSR
		@Optional() private breakpoint: BreakpointObserver) {

		// Alternative method to get mobile, for server.
		if (!!server) { this._isMobileSubject.next(server.isMobile()); return; }
		// Else get from the breakpoint service

		// Handle Mobile devices
		if (breakpoint.isMatched(this._mobileDevices)) { this._isMobileSubject.next(true); }

		// Handle Mobile breakpoint change
		this.breakpoint.observe(this._mobileDevices).subscribe(result => {
			this._isMobileSubject.next(result.matches);
		});
	}

	public isMobile(): BehaviorSubject<boolean> { return this._isMobileSubject; }
}
