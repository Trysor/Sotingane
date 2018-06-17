import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

import { env } from '@env';

import { BehaviorSubject, interval, Subject } from 'rxjs';
import { filter, distinctUntilChanged, debounceTime, takeUntil, takeWhile } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class LoadingService {
	private _requests = new BehaviorSubject<number>(0);
	private _isLoading = new Subject<boolean>();
	private _loadingBarValue = new Subject<number>();

	public get isLoading() { return this._isLoading; }
	public get valueSubject() { return this._loadingBarValue; }

	constructor(@Inject(PLATFORM_ID) private platformId: Object) {
		// Do nothing if we're on the server
		if (isPlatformServer(platformId)) { return; }

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
				takeUntil(this._isLoading),
				takeWhile(num => (num * 100) < env.TIMEOUT)
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
