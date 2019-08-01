import { Component, Optional, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { ModalService, SettingsService, AdminService } from '@app/services';

import { Content, TableSettings, ColumnType } from '@types';

import { AccessHandler, DestroyableClass } from '@app/classes';

import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'pages-component',
	templateUrl: './pages.component.html',
	styleUrls: ['./pages.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagesComponent extends DestroyableClass implements OnDestroy {
	public data = new BehaviorSubject<Content[]>(null);

	private readonly _accessHandler = new AccessHandler();

	public readonly settings: TableSettings<Content> = {
		columns: [
			{
				header: '',
				property: 'edit',
				noSort: true,
				type: ColumnType.InternalLink,
				icon: { val: () => 'mode_edit' },
				ariaLabel: c => `Edit content: ${c.title}`,
				removeText: true,
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
				// icon: { val: c => this._accessHandler.getAccessChoice(c.access).icon },
				val: c => {
					if (c.access.length === 0) {
						return this._accessHandler.getAccessChoice(null).single;
					}
					return c.access.map(role => this._accessHandler.getAccessChoice(role).single).join(', ');
				}
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
				removeText: true,
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

		super();
		this.adminService.getAllContent().pipe(takeUntil(this.OnDestroy)).subscribe((contentList) => {
			this.data.next(contentList);
		});
	}
}
