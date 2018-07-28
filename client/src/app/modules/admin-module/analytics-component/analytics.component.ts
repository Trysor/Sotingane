import { Component, Optional, OnDestroy, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';

import {
	CmsContent, AccessRoles, User, AggregationQuery, AggregationResult,
	TableSettings, ColumnType, ColumnDir, ColumnSettings
} from '@app/models';
import { ModalService, CMSService, AdminService, MobileService } from '@app/services';

import { FormErrorInstant, AccessHandler } from '@app/classes';

import { min as DateMin } from 'date-fns';

import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

enum AnalyticsState {
	QUERY,
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
	public loading = false;

	// Helpers
	public readonly AccessRoles = AccessRoles;
	public readonly accessHandler = new AccessHandler();
	public readonly AnalyticsState = AnalyticsState;

	// Date Properties
	public get today() { return new Date(); }

	public get maxSeenAfterDate() {
		return !this.aggregateForm.get('seenBeforeDate').value
			? this.today
			: DateMin([this.today, <Date>this.aggregateForm.get('seenBeforeDate').value]);
	}

	public get minSeenBeforeDate() {
		return !this.aggregateForm.get('seenAfterDate').value
			? null
			: DateMin([this.today, <Date>this.aggregateForm.get('seenAfterDate').value]);
	}

	public get maxCreatedAfterDate() {
		return !this.aggregateForm.get('createdBeforeDate').value
			? this.today
			: DateMin([this.today, <Date>this.aggregateForm.get('createdBeforeDate').value]);
	}

	public get minCreatedBeforeDate() {
		return !this.aggregateForm.get('createdAfterDate').value
			? null
			: DateMin([this.today, <Date>this.aggregateForm.get('createdAfterDate').value]);
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
	public readonly unwindSettings: TableSettings<AggregationResult> = {
		columns: [
			{
				header: 'Timestamp',
				property: 'logDataTs',
				val: a => this.datePipe.transform(a.logDataTs, 'yyyy-MM-dd HH:mm:ss')
				// DatePipe does not follow ISO standard for date formats
			},
			{
				header: 'Page',
				property: 'title',
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
		dir: ColumnDir.DESC,

		trackBy: (index: number, a) => a.route
	};


	public readonly settings: TableSettings<AggregationResult> = {
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
				header: 'Views',
				property: 'views',
				val: (a) => a.views.toString()
			}
		],
		mobile: ['title', 'route', 'views'],

		active: 'title',
		dir: ColumnDir.ASC,

		trackBy: (index: number, a) => a.route
	};


	constructor(
		public mobileService: MobileService,
		private router: Router,
		private fb: FormBuilder,
		private cmsService: CMSService,
		private adminService: AdminService,
		private snackBar: MatSnackBar,
		private datePipe: DatePipe) {

		// Form
		this.aggregateForm = fb.group({
			// Content Filters
			'createdBy': [''],
			'access': [''],
			'published': [true],
			'route': [''],
			'folder': [''],
			'createdAfterDate': [''],
			'createdBeforeDate': [''],
			// User Filters
			'seenAfterDate': [''],
			'seenBeforeDate': [''],
			'readBy': [[]],
			'browsers': [[]],
			'unwind': [false],
		});

		// Get users
		this.adminService.getAllusers().pipe(takeUntil(this._ngUnsub)).subscribe(users => {
			this.users.next(users);
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

		this.loading = true;
		this.adminService.getAggregatedData(query).subscribe(data => {
			this.loading = false;
			if (Array.isArray(data)) {
				this.data.next(data);
				this.setState(AnalyticsState.RESULTS);
				return;
			}
			this.data.next(null);
			this.openSnackBar((<any>data).message);
		});
	}

	public newQuery() {
		this.data.next(null);
	}

	/**
	 * Opens a snackbar with the given message and action message
	 * @param  {string} message The message that is to be displayed
	 * @param  {string} action  the action message that is to be displayed
	 */
	private openSnackBar(message: string, action?: string) {
		this.snackBar.open(message, action, {
			duration: 5000,
		});
	}


	setState(newState: AnalyticsState) {
		this.state.next(newState);
	}
}
