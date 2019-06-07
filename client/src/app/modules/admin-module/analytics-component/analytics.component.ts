import { Component, OnDestroy, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

import {
	AggregationQuery, AggregationResult, AggregationResultSummarized, AggregationResultUnwinded, User, TableSettings
} from '@types';
import { CMSService, AdminService, MobileService, SnackBarService } from '@app/services';

import { FormErrorInstant, AccessHandler } from '@app/classes';

import { min as DateMin } from 'date-fns';

import { Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, distinctUntilChanged, catchError } from 'rxjs/operators';

enum AnalyticsState {
	QUERY,
	LOADING,
	RESULTS
}

@Component({
	selector: 'analytics-component',
	templateUrl: './analytics.component.html',
	styleUrls: ['./analytics.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsComponent implements OnDestroy, AfterViewInit {
	private _ngUnsub = new Subject();

	// Subjects
	public data = new BehaviorSubject<AggregationResult[]>(null);
	public users = new BehaviorSubject<User[]>(null);
	public state = new BehaviorSubject<AnalyticsState>(AnalyticsState.QUERY);

	// Form handlers
	public readonly aggregateForm: FormGroup; // Form
	public readonly formErrorInstant = new FormErrorInstant(); // Form validation errors trigger instantly

	// Helpers
	public readonly accessHandler = new AccessHandler();
	public readonly AnalyticsState = AnalyticsState;

	// Date Properties
	public get today() { return new Date(); }

	public get maxSeenAfterDate() {
		return !this.aggregateForm.get('seenBeforeDate').value
			? this.today
			: DateMin([this.today, this.aggregateForm.get('seenBeforeDate').value as Date]);
	}

	public get minSeenBeforeDate() {
		return !this.aggregateForm.get('seenAfterDate').value
			? null
			: DateMin([this.today, this.aggregateForm.get('seenAfterDate').value as Date]);
	}

	public get maxCreatedAfterDate() {
		return !this.aggregateForm.get('createdBeforeDate').value
			? this.today
			: DateMin([this.today, this.aggregateForm.get('createdBeforeDate').value as Date]);
	}

	public get minCreatedBeforeDate() {
		return !this.aggregateForm.get('createdAfterDate').value
			? null
			: DateMin([this.today, this.aggregateForm.get('createdAfterDate').value as Date]);
	}

	// Browsers
	public readonly browsers = [
		'Amaya', 'Android Browser', 'Arora', 'Avant', 'Baidu', 'Blazer', 'Bolt', 'Bowser', 'Camino', 'Chimera',
		'Chrome', 'Chrome WebView', 'Chromium', 'Comodo Dragon', 'Conkeror', 'Dillo', 'Dolphin', 'Doris', 'Edge',
		'Epiphany', 'Fennec', 'Firebird', 'Firefox', 'Flock', 'GoBrowser', 'iCab', 'ICE Browser', 'IceApe',
		'IceCat', 'IceDragon', 'Iceweasel', 'IE', 'IEMobile', 'Iron', 'Jasmine', 'K-Meleon', 'Konqueror', 'Kindle',
		'Links', 'Lunascape', 'Lynx', 'Maemo', 'Maxthon', 'Midori', 'Minimo', 'MIUI Browser', 'Mobile Safari', 'Mobile Safari',
		'Mosaic', 'Mozilla', 'Netfront', 'Netscape', 'NetSurf', 'Nokia', 'OmniWeb', 'Opera', 'Opera Mini', 'Opera Mobi', 'Opera Tablet',
		'PhantomJS', 'Phoenix', 'Polaris', 'QQBrowser', 'QQBrowserLite', 'Quark', 'RockMelt', 'Silk', 'Skyfire',
		'SeaMonkey', 'Sleipnir', 'SlimBrowser', 'Swiftfox', 'Tizen', 'UCBrowser', 'Vivaldi', 'w3m', 'Waterfox',
		'WeChat', 'Yandex'
	].sort();


	// Results Settings
	public readonly unwindSettings: TableSettings<AggregationResultUnwinded> = {
		columns: [
			{
				header: 'Timestamp',
				property: 'logDataTs',
				val: a => this.datePipe.transform(a.logDataTs, 'yyyy-MM-dd HH:mm:ss')
			},
			{
				header: 'Route',
				property: 'route',
			},
			{
				header: 'User',
				property: 'logDataUser',
				val: a => {
					const user = this.users.getValue().find(u => u._id === a.logDataUser);
					if (user) { return user.username; }
					return 'Anonymous';
				},
			},
			{
				header: 'Browser',
				property: 'logDataBrowser',
				val: a => a.logDataBrowser ? `${a.logDataBrowser} ${a.logDataBrowserVer}` : 'Unknown'
			}
		],
		mobile: ['logDataTs', 'title', 'logDataUser'],

		active: 'logDataTs',
		dir: 'desc',

		trackBy: (index: number, a) => a.logDataId
	};


	public readonly settings: TableSettings<AggregationResultSummarized> = {
		columns: [
			{
				header: 'Title',
				property: 'title',
			},
			{
				header: 'Route',
				property: 'route',
			},
			{
				header: 'Access',
				property: 'access',
				// icon: { val: a => this.accessHandler.getAccessChoice(a.access).icon },
				val: c => {
					if (c.access.length === 0) {
						return this.accessHandler.getAccessChoice(null).single;
					}
					return c.access.map(role => this.accessHandler.getAccessChoice(role).single).join(', ');
				}
			},
			{
				header: 'Views',
				property: 'views',
				rightAlign: true,
				val: (a) => a.views
			},
			{
				header: 'Last visited',
				property: 'lastVisit',
				rightAlign: true,
				val: (a) => this.datePipe.transform(a.lastVisit, 'yyyy-MM-dd HH:mm:ss')
			}
		],
		mobile: ['title', 'route', 'views'],

		active: 'title',
		dir: 'asc',

		trackBy: (index: number, a) => a.route
	};


	constructor(
		public mobileService: MobileService,
		private router: Router,
		private fb: FormBuilder,
		private cmsService: CMSService,
		private adminService: AdminService,
		private snackBar: SnackBarService,
		private datePipe: DatePipe) {

		// Form
		const _disableAccessOnInit = true;
		this.aggregateForm = fb.group({
			// Content Filters
			createdBy: [''],
			access: new FormControl({ value: [], disabled: _disableAccessOnInit }),
			accessFilter: [!_disableAccessOnInit],
			published: [true],
			route: [''],
			folder: [''],
			createdAfterDate: [''],
			createdBeforeDate: [''],
			// User Filters
			seenAfterDate: [''],
			seenBeforeDate: [''],
			readBy: [[]],
			browsers: [[]],
			unwind: [false],
		});

		// Get users
		this.adminService.getAllusers().pipe(takeUntil(this._ngUnsub)).subscribe(users => {
			this.users.next(users);
		});

		this.aggregateForm.get('accessFilter').valueChanges.pipe(takeUntil(this._ngUnsub)).subscribe(val => {
			if (val) {
				this.aggregateForm.get('access').enable();
			} else {
				this.aggregateForm.get('access').disable();
			}
		});
	}

	ngOnDestroy(): void {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}

	ngAfterViewInit(): void {
		// Track changes
		this.aggregateForm.get('unwind').valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
			this.data.next(null);
		});
	}


	public submitForm() {
		const query: AggregationQuery = this.aggregateForm.value;
		if (!(query as any).accessFilter) {
			delete query.access;
		}
		delete (query as any).accessFilter; // noAccessFilter isn't part of the request to the API

		this.setState(AnalyticsState.LOADING);
		this.adminService.getAggregatedData(query).pipe(
			catchError(() => of(null))
		).subscribe(data => {
			if (!data) {
				this.setState(AnalyticsState.QUERY);
				return;
			}

			if (Array.isArray(data)) {
				this.data.next(data);
				this.setState(AnalyticsState.RESULTS);
				return;
			}
			this.setState(AnalyticsState.QUERY);
			this.data.next(null);
			this.snackBar.open((data as any).message);
		});
	}

	public newQuery() {
		this.data.next(null);
	}

	setState(newState: AnalyticsState) {
		this.state.next(newState);
	}
}
