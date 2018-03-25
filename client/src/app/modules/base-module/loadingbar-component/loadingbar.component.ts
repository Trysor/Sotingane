import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { Subject, Subscription, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HttpService } from '@app/services';

@Component({
	selector: 'loadingbar-component',
	templateUrl: './loadingbar.component.html',
	styleUrls: ['./loadingbar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingbarComponent implements OnDestroy {
	private readonly _ngUnsub = new Subject();

	public readonly loadingBarValue = new Subject<number>();
	public readonly loadingBarVisible = new Subject<boolean>();

	private _loadingBarSub: Subscription;

	constructor(private http: HttpService) {
		http.isLoading.pipe(takeUntil(this._ngUnsub)).subscribe(isLoading => {
			// Unsubscribe
			if (this._loadingBarSub) { this._loadingBarSub.unsubscribe(); }

			// Set values
			this.loadingBarVisible.next(isLoading);
			this.loadingBarValue.next(0);

			// If we're not loading, stop here.
			if (!isLoading) { return; }

			// Start timer, ticks every 100ms
			this._loadingBarSub = interval(100).subscribe(num => {
				this.loadingBarValue.next(Math.min(90, num * 10));
			});
		});

	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}

}
