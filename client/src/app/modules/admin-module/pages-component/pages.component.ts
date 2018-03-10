import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { CmsContent, AccessRoles, TableSettings, ColumnType, ColumnDir } from '@app/models';
import { ModalService, CMSService, AdminService, MobileService } from '@app/services';

import { Subject } from 'rxjs/Subject';

@Component({
	selector: 'pages-component',
	templateUrl: './pages.component.html',
	styleUrls: ['./pages.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagesComponent {

	public data = new Subject<CmsContent[]>();

	public readonly settings: TableSettings = {
		columns: [ // ['title', 'views', 'access', 'nav', 'edit'],
			{
				header: 'Title',
				property: 'title',
			},
			{
				header: 'Views',
				property: 'views',
				rightAlign: true,
				tooltip: (c: CmsContent) => {
					const time = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
					return `Views per day: ${(c.views / time).toFixed(2)}`;
				}
			},
			{
				header: 'Access',
				property: 'access',
				icon: (c: CmsContent): string => {
					switch (c.access) {
						case AccessRoles.admin: { return 'security'; }
						case AccessRoles.user: { return 'verified_user'; }
						case AccessRoles.everyone: { return 'group'; }
					}
				},
				displayFormat: (c: CmsContent): string => {
					switch (c.access) {
						case AccessRoles.admin: { return 'Admins'; }
						case AccessRoles.user: { return 'Users'; }
						case AccessRoles.everyone: { return 'Everyone'; }
					}
				},
			},
			{
				header: 'Navigation',
				property: 'nav',
				displayFormat: (c: CmsContent): string => {
					return c.nav ? 'Shown' : 'Hidden';
				}
			},
			{
				header: 'Folder',
				property: 'folder',
			},
			{
				header: 'Last updated',
				property: 'updatedAt',
				displayFormat: (c: CmsContent): string => {
					return this.datePipe.transform(c.updatedAt);
				}
			},
			{
				header: 'Edit',
				property: 'edit',
				noSort: true,
				type: ColumnType.InternalLink,
				icon: () => 'mode_edit',
				noText: true,
				func: (c: CmsContent) => {
					return `/compose/${c.route}`;
				},
				narrow: true
			},
			{
				header: 'Delete',
				property: 'delete',
				noSort: true,
				type: ColumnType.Button,
				icon: () => 'delete',
				color: 'warn',
				noText: true,
				func: (c: CmsContent) => this.modalService.openDeleteContentModal(c),
				disabled: (c: CmsContent) => c.route === 'home',
				narrow: true
			}
		],
		mobile: ['title', 'views', 'route'], // route = edit

		active: 'title',
		dir: ColumnDir.ASC,

		trackBy: (index: number, item: CmsContent) => item.route,
		rowClick: (c: CmsContent) => this.router.navigateByUrl('/' + c.route)
	};




	constructor(
		private router: Router,
		private modalService: ModalService,
		private cmsService: CMSService,
		private adminService: AdminService,
		private datePipe: DatePipe) {

		adminService.getAllContent().subscribe((contentList) => {
			this.data.next(contentList);
		});
	}



}
