import { Component, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators } from '@angular/forms';

import { SteamService } from '@app/services';

import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'steam-component',
	templateUrl: './steam.component.html',
	styleUrls: ['./steam.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SteamComponent implements OnDestroy {
	private _ngUnsub = new Subject();
	public forms: FormGroup[];


	// TODO: FIX ME!
	static disallowedRoutes(contentList: BehaviorSubject<any[]>) {
		return (control: AbstractControl): { [key: string]: any } => {
			const list = contentList.getValue();
			if (list && list.some((content) => content.route === control.value)) {
				return { routeAlreadyTaken: true };
			}
		};
	}


	constructor(
		private fb: FormBuilder,
		public steam: SteamService) {


		// https://angular.io/guide/reactive-forms#conclusion
	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}

	addServer() {

	}

	editServer() {

	}

}
