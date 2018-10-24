import { Component, Optional, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { CmsContent, TableSettings, ColumnType } from '@app/models';
import { ModalService, SettingsService, AdminService } from '@app/services';

import { AccessHandler } from '@app/classes';

import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'pages-component',
	templateUrl: './pages.component.html',
	styleUrls: ['./pages.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagesComponent implements OnDestroy {
	private _ngUnsub = new Subject();
	public data = new BehaviorSubject<CmsContent[]>(null);

	private readonly _accessHandler = new AccessHandler();

	public readonly settings: TableSettings<CmsContent> = {
		columns: [
			{
				header: '',
				property: 'edit',
				noSort: true,
				type: ColumnType.InternalLink,
				icon: { val: () => 'mode_edit' },
				noText: true,
				func: c => `/compose/${c.route}`,
				narrow: true,
			},
			{
				header: 'Title',
				property: 'title',
			},
			{
				header: 'Views',
				property: 'views',
				rightAlign: true,
				tooltip: c => {
					const time = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
					return `Views per day: ${(c.views / time).toFixed(2)}`;
				}
			},
			{
				header: 'Access',
				property: 'access',
				icon: { val: c => this._accessHandler.getAccessChoice(c.access).icon },
				val: c => this._accessHandler.getAccessChoice(c.access).single
			},
			{
				header: 'Published',
				property: 'published',
				val: c => c.published ? 'Published' : 'Unpublished'
			},
			{
				header: 'Navigation',
				property: 'nav',
				val: c => c.nav ? 'Shown' : 'Hidden'
			},
			{
				header: 'Folder',
				property: 'folder',
			},
			{
				header: 'Last updated',
				property: 'updatedAt',
				val: c => this.datePipe.transform(c.updatedAt)
			},
			{
				header: '',
				property: 'delete',
				noSort: true,
				type: ColumnType.Button,
				icon: {
					val: () => 'delete',
					color: 'warn'
				},
				noText: true,
				func: c => this.modalService.openDeleteContentModal(c),
				disabled: c => c.route === this.settingsService.settings.getValue().indexRoute,
				narrow: true
			}
		],
		mobile: ['title', 'views', 'edit'],

		active: 'title',
		dir: 'asc',

		trackBy: (index, item) => item.route,
		rowClick: c => this.router.navigateByUrl('/' + c.route)
	};




	constructor(
		@Optional() private modalService: ModalService,
		private router: Router,
		private settingsService: SettingsService,
		private adminService: AdminService,
		private datePipe: DatePipe) {

		this.adminService.getAllContent().pipe(takeUntil(this._ngUnsub)).subscribe((contentList) => {
			this.data.next(contentList);
		});
	}

	ngOnDestroy(): void {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}

}
