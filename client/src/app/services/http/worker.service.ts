import { Injectable, NgZone } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

import { MatSnackBar } from '@angular/material';

import { env } from '@env';
import { PlatformService } from '@app/services/utility/platform.service';


import { interval } from 'rxjs';


@Injectable()
export class WorkerService {

	constructor(
		private platform: PlatformService,
		private ngZone: NgZone,
		private updates: SwUpdate,
		private snackBar: MatSnackBar) {

		if (!env.production) { return; }
		if (platform.isServer) { return; }

		// TODO: revert this back when it has been fixed
		// interval(6 * 60 * 60).subscribe(() => updates.checkForUpdate());
		ngZone.runOutsideAngular(() => {
			interval(6 * 60 * 60).subscribe(() => {
				this.ngZone.run(() => this.updates.checkForUpdate());
			});
		});
		// check right away
		updates.checkForUpdate();

		updates.available.subscribe(event => {
			console.log('current version is', event.current);
			console.log('available version is', event.available);
			this.openSnackBar();
		});
		updates.activated.subscribe(event => {
			console.log('old version was', event.previous);
			console.log('new version is', event.current);
		});
	}

	private openSnackBar() {
		this.snackBar.open('An update is available!', 'Update', {
			duration: 1000 * 60 * 2, // 2 mins
		}).onAction().subscribe(event => {
			this.updates.activateUpdate().then(() => document.location.reload());
		});
	}
}
