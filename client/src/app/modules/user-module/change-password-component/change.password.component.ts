import { Component, ChangeDetectionStrategy, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { ModalService, AuthService } from '@app/services';
import { User, UpdatePasswordUser, ModalData } from '@app/models';


@Component({
	selector: 'change-password-component',
	templateUrl: './change.password.component.html',
	styleUrls: ['./change.password.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePasswordComponent {
	public changePasswordForm: FormGroup;

	constructor(
		@Optional() private modalService: ModalService,
		private router: Router,
		private fb: FormBuilder,
		public authService: AuthService) {
		this.changePasswordForm = fb.group({
			'currentPassword': ['', Validators.required],
			'password': ['', Validators.required],
			'confirm': ['', Validators.required]
		}, { validator: this.matchingPasswords.bind(this) });
	}

	/**
	 * Submits the changePasswordForm
	 */
	public submitForm() {
		const user: UpdatePasswordUser = this.changePasswordForm.value;
		const sub = this.authService.updatePassword(user).subscribe(
			result => {
				if (result) {
					this.changePasswordForm.reset();
					this.changePasswordForm.markAsUntouched();
					this.router.navigateByUrl('/');
				}
				this.modalService.openPasswordChangeModal(result);
				sub.unsubscribe();
			},
			error => {
				sub.unsubscribe();
			}
		);
	}


	/**
	 * Compares the password and confirm fields and returns true if they match
	 * @param  {FormGroup} group the form group upon which the check is done
	 * @return {boolean}         if the fields match
	 */
	private matchingPasswords(group: FormGroup) {
		// if they do not match, then we return that matchingPasswords is true (in that it is an error)
		if (group.get('password').value !== group.get('confirm').value) {
			return { matchingPasswords: true };
		}
		return null;
	}
}
