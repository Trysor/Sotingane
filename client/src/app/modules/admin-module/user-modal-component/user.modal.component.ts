import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSelectChange } from '@angular/material';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

import { CMSService, AdminService, AuthService } from '@app/services';
import { User, AccessRoles, CmsAccess } from '@app/models';

import { Subject } from 'rxjs/Subject';

@Component({
	selector: 'user-modal',
	styleUrls: ['./user.modal.component.scss'],
	templateUrl: './user.modal.component.html',
	changeDetection: ChangeDetectionStrategy.Default
})
export class UserModalComponent {
	public patchUserForm: FormGroup;
	public otherUsernames: string[];
	public issue = new Subject<string>();

	public accessChoices: CmsAccess[] = [
		{ value: AccessRoles.user, verbose: 'User', icon: 'verified_user' },
		{ value: AccessRoles.admin, verbose: 'Admin', icon: 'security' }
	];
	
	constructor(
		public dialogRef: MatDialogRef<UserModalComponent>,
		private adminService: AdminService,
		public authService: AuthService,
		private fb: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public data: UserModalData) {

		// Have to init this list before the form group
		this.otherUsernames = this.data.userList.filter(user => user !== data.user).map(user => user.username.toLowerCase());

		this.patchUserForm = fb.group({
			'username': [data.user.username, Validators.compose([Validators.required, this.usernameTaken.bind(this)])],
			'role': [data.user.role, Validators.required]
		});
	}

	/**
	 * Proceeds with the task and closes the modal.
	 */
	submitForm(): void {
		this.issue.next(null);
		this.patchUserForm.disable();

		const user: User = this.patchUserForm.value;
		user._id = this.data.user._id;

		const sub = this.adminService.patchUser(user).subscribe(
			() => {
				this.issue.next(null);
				this.dialogRef.close(true);
				sub.unsubscribe();
			},
			() => {
				this.issue.next('Could not save the user.');
				this.patchUserForm.enable();
				sub.unsubscribe();
			}
		);
	}

	/**
	 * Closes the modal without proceeding.
	 */
	close(): void {
		this.dialogRef.close(false);
	}

	private usernameTaken(control: FormControl) {
		return this.otherUsernames.includes(control.value.toLowerCase()) ? { usernameTaken: true } : null;
	}
}


export interface UserModalData {
	user: User;
	userList: User[];
}
