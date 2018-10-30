import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { SettingsService } from '@app/services';

import { first } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {

	constructor(
		private settingsService: SettingsService,
		private router: Router) { }


	canActivate() {
		this.settingsService.settings.pipe(first(settings => settings.indexRoute !== '')).subscribe(settings => {
			this.router.navigateByUrl(`/${settings.indexRoute}`);
		});
		return false;
	}
}
