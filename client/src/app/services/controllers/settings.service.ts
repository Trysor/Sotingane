import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

import { Settings, Theme } from '@types';

import { HttpService } from '@app/services/http/http.service';
import { PlatformService } from '@app/services/utility/platform.service';

import { env } from '@env';
import { BehaviorSubject, of } from 'rxjs';
import { take, catchError } from 'rxjs/operators';

const emptySettings: Settings = {
	indexRoute: '',
	org: '',
	meta: {
		title: '',
		desc: ''
	},
	footer: {
		text: '',
		copyright: ''
	}
};

const emptyTheme: Theme = {
	name: '',
	vars: {
		'--app-prim-1': '',
		'--app-prim-2': '',
		'--app-prim-3': '',
		'--app-prim-c-1': '',
		'--app-prim-c-2': '',
		'--app-prim-c-3': '',

		'--app-acc-1': '',
		'--app-acc-2': '',
		'--app-acc-3': '',
		'--app-acc-c-1': '',
		'--app-acc-c-2': '',
		'--app-acc-c-3': '',

		'--color-text': '',

		'--color-background': '',
		'--color-header': '',
		'--color-sidepanel': '',
		'--color-material': '',
		'--color-content': '',
		'--color-shade': '',
		'--color-active': '',
		'--color-overlay': '',
		'--color-border': '',
		'--color-disabled': '',

		'--border': '',
		'--shadow': '',

		'--width-wrapper': '',
		'--width-side': '',
		'--width-max-field': '',
		'--height-header': ''
	}
};




@Injectable({ providedIn: 'root' })
export class SettingsService {
	private _settingsSubject: BehaviorSubject<Settings> = new BehaviorSubject(emptySettings);
	private _themeSubject: BehaviorSubject<Theme> = new BehaviorSubject(emptyTheme);
	private _renderer: Renderer2;

	get settings() { return this._settingsSubject; }


	constructor(
		private http: HttpService,
		private platform: PlatformService,
		private rendererFactory: RendererFactory2) {

		this._renderer = this.rendererFactory.createRenderer(null, null);

		this.updateSettings();
		this.updateTheme();
	}


	public updateSettings() {
		this.getSettings().pipe(
			take(1),
			catchError(() => of(null))
		).subscribe(settings => {
			if (settings) {
				this._settingsSubject.next(settings);
			} else {
				this._settingsSubject.error(emptySettings);
			}
		});
	}

	public updateTheme() {
		this.getTheme().pipe(take(1)).subscribe((theme) => {
			this._themeSubject.next(theme);
			this.renderTheme(theme);
		});
	}

	private renderTheme(theme: Theme) {
		for (const entry of Object.entries(theme)) {
			// this.platform.document.documentElement.style.setProperty(entry['0'], entry['1']);
			// this._renderer.setStyle(this.platform.document.body.style, entry['0'], entry['1']);
		}
	}


	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	private getSettings() {
		return this.http.client.get<Settings>(env.API.settings);
	}

	public postSettings(settings: Settings) {
		return this.http.client.post<boolean>(env.API.settings, settings);
	}

	private getTheme() {
		return this.http.client.get<Theme>(env.API.theme);
	}

	public postTheme(theme: Theme) {
		return this.http.client.post<boolean>(env.API.theme, theme);
	}
}
