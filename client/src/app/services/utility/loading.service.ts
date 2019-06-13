import { Injectable } from '@angular/core';

import { env } from '@env';
import { PlatformService } from '@app/services/utility/platform.service';

import { BehaviorSubject, interval, Subject, Subscription } from 'rxjs';
import { filter, distinctUntilChanged, debounceTime, takeWhile } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class LoadingService {
	private static readonly TICK_RATE = 10;

	private readonly _requests = new BehaviorSubject<number>(0);
	private readonly _isLoading = new Subject<boolean>();
	private readonly _loadingBarValue = new Subject<number>();

	private _subscription: Subscription;


	public get isLoading() { return this._isLoading; }
	public get valueSubject() { return this._loadingBarValue; }

	constructor(private platform: PlatformService) {
		// Do nothing if we're on the server
		if (this.platform.isServer) { return; }

		// whenever the requests-subject is distinctly changed,
		// delay 50ms before we push update to the loading subject
		this._requests.pipe(
			filter(x => x === 1 || x === 0),
			distinctUntilChanged(),
			debounceTime(50)
		).subscribe(subs => {
			this._isLoading.next(subs > 0);
		});

		this._isLoading.subscribe(newVal => {
			if (!!this._subscription) { this._subscription.unsubscribe(); }
			if (!newVal) { return; }

			// Start timer, ticks every TICK_RATE ms.
			this._subscription = interval(LoadingService.TICK_RATE).pipe(
				takeWhile(num => (num * LoadingService.TICK_RATE) < env.TIMEOUT)
			).subscribe(num => {
				this._loadingBarValue.next((num * LoadingService.TICK_RATE * 100) / env.TIMEOUT);
			});
		});

	}

	public addRequest() {
		this._requests.next(this._requests.getValue() + 1);
	}

	public removeRequest() {
		this._requests.next(this._requests.getValue() - 1);
	}
}
