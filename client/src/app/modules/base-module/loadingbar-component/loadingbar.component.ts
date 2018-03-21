import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

import { Subject, Subscription, interval } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

@Component({
	selector: 'loadingbar-component',
	templateUrl: './loadingbar.component.html',
	styleUrls: ['./loadingbar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingbarComponent implements OnInit {
	private _ngUnsub = new Subject();
	private _loadingBarSub: Subscription;

	public loadingBarValue = new Subject<number>();
	public loadingBarVisible = new Subject<boolean>();

	constructor(private router: Router) {}

	ngOnInit() {
		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => {
			if (e instanceof NavigationStart) {
				this.loadingBarValue.next(0);

				if (this._loadingBarSub) { this._loadingBarSub.unsubscribe(); }

				this._loadingBarSub = interval(100).subscribe(num => { // every 100ms
					if (num === 1) { this.loadingBarVisible.next(true); }
					this.loadingBarValue.next(Math.min(90, num * 10));
				});
			} else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
				if (this._loadingBarSub) { this._loadingBarSub.unsubscribe(); }

				this.loadingBarValue.next(100); // 100 = max
				this.loadingBarVisible.next(false);
			}
		});
	}

}
