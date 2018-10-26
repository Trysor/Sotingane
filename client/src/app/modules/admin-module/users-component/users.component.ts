import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';

import { DatePipe } from '@angular/common';

import { AdminService, AuthService } from '@app/services';
import { AccessHandler } from '@app/classes';

import { User, TableSettings, ColumnType } from '@types';
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

	private readonly _accessHandler = new AccessHandler();

	public readonly settings: TableSettings<User> = {
		columns: [
			{
				header: 'Username',
				property: 'username',
			},
			{
				header: 'Role',
				property: 'role',
				icon: { val: user => this._accessHandler.getAccessChoice(user.role).icon },
				val: user => this._accessHandler.getAccessChoice(user.role).single
			},
			{
				header: 'Joined date',
				property: 'createdAt',
				val: (user: User): string => {
					return this.datePipe.transform(user.createdAt);
				}
			},
			{
				header: '',
				property: '_id',
				noSort: true,
				type: ColumnType.Button,
				icon: { val: () => 'settings' },
				noText: true,
				func: (user, users) => {
					this.dialog.open(
						UserModalComponent,
						<MatDialogConfig>{ data: <UserModalData>{ user: user, userList: users } }
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
