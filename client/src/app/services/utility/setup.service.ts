import { Injectable, Optional } from '@angular/core';

import { AuthService } from '@app/services/controllers/auth.service';
import { CMSService } from '@app/services/controllers/cms.service';
import { PlatformService } from '@app/services/utility/platform.service';
import { WorkerService } from '@app/services/http/worker.service';
import { ServerService } from '@app/services/http/server.service';

import { JWTUser } from '@types';

import { Subscription, timer } from 'rxjs';
import { take, distinctUntilChanged } from 'rxjs/operators';




@Injectable({ providedIn: 'root' })
export class SetupService {

	// Auth related fields
	private _renewalSub: Subscription;
	private _hasDoneInitialTokenRenewal = false;


	constructor(
		@Optional() private workerService: WorkerService,
		@Optional() public serverService: ServerService,
		private platform: PlatformService,
		private authService: AuthService,
		private cmsService: CMSService) {

		if (this.platform.isBrowser) {
			this.authService.user.pipe(distinctUntilChanged()).subscribe(user => {
				this.engageRenewTokenTimer(user);

				if (this._hasDoneInitialTokenRenewal) {
					this.cmsService.getContentList(true);
				}
			});
		}

		// Subscribe to the initial setup of user token data by adding another sub
		// to the subscription executed by renewToken
		this.authService.renewToken().add(() => {
			// This code occurs AFTER the initial subscribe callback has run
			this._hasDoneInitialTokenRenewal = true;
			this.cmsService.getContentList(true);
		});

	}



	// ---------------------------------------
	// ------------ USER METHODS -------------
	// ---------------------------------------

	/**
	 * Starts a timer to renew the jwt before it exires
	 */
	private engageRenewTokenTimer(user: JWTUser) {
		// cancel any ongoing timers
		if (this._renewalSub) { this._renewalSub.unsubscribe(); }
		if (!user) { return; }

		// Start new timer
		const newTime = Math.max(user.exp * 1000 - Date.now(), 0);

		// Update the token(s) and re-engage timer on complete
		this._renewalSub = timer(newTime).pipe(take(1)).subscribe(() => this.authService.renewToken());
	}
}
