import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import { SettingsService } from '@app/services/controllers/settings.service';

import { AppSettings } from '@app/models';

import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';


@Component({
	selector: 'settings-component',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnDestroy {

	public settingsForm: FormGroup;

	private _ngUnsub = new Subject();

	constructor(
		private settingsService: SettingsService,
		private fb: FormBuilder) {

		this.settingsForm = fb.group({
			'indexRoute': ['', Validators.required],
			'org': ['', Validators.required],
			'meta': fb.group({
				'title': ['', Validators.required],
				'desc': ['', Validators.required]
			}),
			'footer': fb.group({
				'text': ['', Validators.required],
				'copyright': ['', Validators.required]
			})
		});

		this.settingsService.updateSettings();

		this.settingsService.settings.pipe(takeUntil(this._ngUnsub)).subscribe( newSettings => {
			this.settingsForm.setValue(newSettings);
		});
	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}

	public submitForm() {
		const settings: AppSettings = this.settingsForm.getRawValue();
		console.log(settings);
		this.settingsService.postSettings(settings).pipe(take(1)).subscribe(
			() => this.settingsService.settings.next(settings),
			err => { console.log('err', err); }
		);
	}
}
