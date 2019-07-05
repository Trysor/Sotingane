import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { SettingsService } from '@app/services';

import { first, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {

	constructor(
		private settingsService: SettingsService,
		private router: Router) { }


	canActivate() {
		return this.settingsService.settings.pipe(
			first(settings => settings.indexRoute !== ''),
			map(settings => this.router.parseUrl(`/${settings.indexRoute}`))
		);
	}
}
