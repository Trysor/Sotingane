import { Component, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { DatePipe } from '@angular/common';

import { AdminService } from '@app/services/controllers/admin.service';
import { AuthService } from '@app/services/controllers/auth.service';
import { AccessHandler, DestroyableClass } from '@app/classes';

import { User, TableSettings, ColumnType } from '@types';
import { UserModalComponent, UserModalData } from '../user-modal-component/user.modal.component';


import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';



@Component({
	selector: 'users-component',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent extends DestroyableClass implements AfterViewInit {
	public data = new BehaviorSubject<User[]>(null);

	private readonly _accessHandler = new AccessHandler();

	public readonly settings: TableSettings<User> = {
		columns: [
			{
				header: 'Username',
				property: 'username',
			},
			{
				header: 'Roles',
				property: 'roles',
				val: user => user.roles.map(role => this._accessHandler.getAccessChoice(role).single).join(', ')
			},
			{
				header: 'Joined date',
				property: 'createdAt',
				val: user => this.datePipe.transform(user.createdAt)
			},
			{
				header: '',
				property: '_id',
				noSort: true,
				type: ColumnType.Button,
				icon: { val: () => 'settings' },
				ariaLabel: u => `Edit user: ${u.username}`,
				removeText: true,
				func: (user, users) => {
					this.dialog.open(
						UserModalComponent,
						{ data: { user, userList: users } as UserModalData } as MatDialogConfig
					).afterClosed().subscribe((closedResult: boolean) => {
						if (closedResult) { this.updateList(); }
					});
				},
				disabled: user => this.authService.isSameUser(user, this.authService.user.getValue()),
				narrow: true
			}
		],

		active: 'username',
		dir: 'asc',

		trackBy: (index, user) => user._id,

		mobile: ['username', 'roles', '_id'], // _id = edit

	};


	constructor(
		private dialog: MatDialog,
		private datePipe: DatePipe,
		public authService: AuthService,
		public adminService: AdminService) {

		super();
	}

	ngAfterViewInit() {
		this.updateList();
	}


	/**
	 * Updates the user list
	 */
	private updateList() {
		this.adminService.getAllusers().pipe(takeUntil(this.OnDestroy)).subscribe(users => {
			this.data.next(users);
		});
	}

}
