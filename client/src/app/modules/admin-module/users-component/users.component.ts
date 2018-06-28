import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';

import { DatePipe } from '@angular/common';

import { AdminService, AuthService } from '@app/services';
import { User, AccessRoles, TableSettings, ColumnType, ColumnDir } from '@app/models';

import { UserModalComponent, UserModalData } from '../user-modal-component/user.modal.component';

import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
	selector: 'users-component',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnDestroy {
	private _ngUnsub = new Subject();
	public data = new BehaviorSubject<User[]>(null);

	public readonly settings: TableSettings = {
		columns: [
			{
				header: 'Username',
				property: 'username',
			},
			{
				header: 'Role',
				property: 'role',
				icon: (user: User): string => {
					switch (user.role) {
						case AccessRoles.admin: { return 'security'; }
						case AccessRoles.user: { return 'verified_user'; }
					}
				},
				displayFormat: (user: User): string => {
					switch (user.role) {
						case AccessRoles.admin: { return 'Admin'; }
						case AccessRoles.user: { return 'User'; }
					}
				},
			},
			{
				header: 'Joined date',
				property: 'createdAt',
				displayFormat: (user: User): string => {
					return this.datePipe.transform(user.createdAt);
				}
			},
			{
				header: '',
				property: '_id',
				noSort: true,
				type: ColumnType.Button,
				icon: () => 'settings',
				noText: true,
				func: (user: User, users: User[]) => {
					this.dialog.open(
						UserModalComponent,
						<MatDialogConfig>{ data: <UserModalData>{ user: user, userList: users } }
					).afterClosed().subscribe((closedResult: boolean) => {
						if (closedResult) { this.updateList(); }
					});
				},
				disabled: (user: User) => this.authService.isSameUser(user, this.authService.user.getValue()),
				narrow: true
			}
		],

		active: 'username',
		dir: ColumnDir.ASC,

		trackBy: (index: number, user: User) => user._id,

		mobile: ['username', 'role', '_id'], // _id = edit

	};


	constructor(
		private dialog: MatDialog,
		private datePipe: DatePipe,
		public authService: AuthService,
		public adminService: AdminService) {
		this.updateList();
	}


	ngOnDestroy(): void {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}


	/**
	 * Updates the user list
	 */
	private updateList() {
		this.adminService.getAllusers().pipe(takeUntil(this._ngUnsub)).subscribe(users => {
			this.data.next(users);
		});
	}

}
