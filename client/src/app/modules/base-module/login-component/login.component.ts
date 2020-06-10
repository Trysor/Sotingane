import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';

import { User } from '@types';
import { AuthService } from '@app/services/controllers/auth.service';

import { BehaviorSubject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { DestroyableClass } from '@app/classes';


enum STATES {
	READY,
	LOADING,
	TRY_AGAIN,
	TIMED_OUT,
}

@Component({
	selector: 'login-component',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent extends DestroyableClass {
	public loginForm: FormGroup;
	public STATES = STATES;
	public state = new BehaviorSubject<STATES>(STATES.READY);

	constructor(
		public dialogRef: MatDialogRef<LoginComponent>,
		private fb: FormBuilder,
		public authService: AuthService) {

		super();
		this.loginForm = this.fb.group({
			username: ['', Validators.required],
			password: ['', Validators.required]
		});
		authService.user.pipe(takeUntil(this.OnDestroy)).subscribe(user => {
			if (!user) { this.state.next(STATES.READY); }
		});

		this.state.pipe(takeUntil(this.OnDestroy)).subscribe(state => {
			if (state === this.STATES.LOADING) {
				this.loginForm.get('username').disable();
				this.loginForm.get('password').disable();
			} else {
				this.loginForm.get('username').enable();
				this.loginForm.get('password').enable();
			}
		});
	}


	/**
	 * Submits the login form
	 */
	public logIn() {
		this.state.next(STATES.LOADING);
		const user: User = this.loginForm.getRawValue();
		return this.authService.login(user).pipe(
			catchError((error: HttpErrorResponse) => {
				this.state.next((error && error.status >= 400 && error.status < 500)
					? STATES.TRY_AGAIN
					: STATES.TIMED_OUT
				);
				return of(false);
			})
		).subscribe((loggedIn) => {
			if (!loggedIn) { return; }
			this.dialogRef.close();
		});
	}
}
