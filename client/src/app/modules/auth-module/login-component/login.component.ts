import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { User } from '@app/models';
import { AuthService } from '@app/services';

import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { takeUntil } from 'rxjs/operators';


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
export class LoginComponent {
	private _ngUnsub = new Subject();

	public loginForm: FormGroup;
	public STATES = STATES;
	public state = new BehaviorSubject<STATES>(STATES.READY);

	constructor(
		private router: Router,
		private fb: FormBuilder,
		public authService: AuthService) {
		this.loginForm = fb.group({
			'username': ['', Validators.required],
			'password': ['', Validators.required]
		});
		authService.getUser().pipe(takeUntil(this._ngUnsub)).subscribe(user => {
			if (!user) { this.state.next(STATES.READY); }
		});

		this.state.pipe(takeUntil(this._ngUnsub)).subscribe(state => {
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
		const sub = this.authService.login(user).subscribe(
			(loggedIn) => {
				sub.unsubscribe();
				if (loggedIn) {
					this.router.navigateByUrl('/');
					return;
				}
				this.state.next(STATES.TRY_AGAIN);
			},
			(error: HttpErrorResponse) => {
				sub.unsubscribe();
				if (error && error.status >= 400 && error.status < 500) {
					this.state.next(STATES.TRY_AGAIN);
					return;
				}
				this.state.next(STATES.TIMED_OUT);
			},
		);
	}
}
