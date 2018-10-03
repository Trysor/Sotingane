import { Injectable } from '@angular/core';

import { env } from '@env';
import { PlatformService } from '@app/services/utility/platform.service';

import { BehaviorSubject, interval, Subject } from 'rxjs';
import { filter, distinctUntilChanged, debounceTime, takeUntil, takeWhile } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class LoadingService {
	private _requests = new BehaviorSubject<number>(0);
	private _isLoading = new Subject<boolean>();
	private _loadingBarValue = new Subject<number>();

	public get isLoading() { return this._isLoading; }
	public get valueSubject() { return this._loadingBarValue; }

	constructor(private platform: PlatformService) {
		// Do nothing if we're on the server
		if (platform.isServer) { return; }

		// whenever the requests-subject is distinctly changed,
		// delay 50ms before we push update to the loading subject
		this._requests.pipe(
			filter(x => 1 >= x),
			distinctUntilChanged(),
			debounceTime(50)
		).subscribe(subs => this._isLoading.next(subs > 0));

		this._isLoading.subscribe(newVal => {
			if (!newVal) { return; }

			// Start timer, ticks every 100ms
			interval(100).pipe(
				takeWhile(num => (num * 100) < env.TIMEOUT),
				takeUntil(this._isLoading)
			).subscribe(num => {
				this._loadingBarValue.next((num * 10000) / env.TIMEOUT);
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
