import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import { SettingsService } from '@app/services/controllers/settings.service';
import { SnackBarService } from '@app/services/utility/snackbar.service';

import { Settings } from '@types';

import { Subject, of } from 'rxjs';
import { take, takeUntil, catchError } from 'rxjs/operators';


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
		private snackBar: SnackBarService,
		private fb: FormBuilder) {

		this.settingsForm = this.fb.group({
			indexRoute: ['', Validators.required],
			org: ['', Validators.required],
			meta: this.fb.group({
				title: ['', Validators.required],
				desc: ['', Validators.required]
			}),
			footer: this.fb.group({
				text: ['', Validators.required],
				copyright: ['', Validators.required]
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
		const settings: Settings = this.settingsForm.getRawValue();
		this.settingsService.postSettings(settings).pipe(take(1), catchError(() => of(false))).subscribe(
			val => {
				if (val) {
					this.settingsService.settings.next(settings);
					this.snackBar.open('Settings have been updated');
					return;
				}
				this.snackBar.open('Could not update settings');
			},
		);
	}
}
