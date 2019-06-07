import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { User } from '@types';
import { AuthService } from '@app/services';

import { Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';


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
export class LoginComponent implements OnDestroy {
	private _ngUnsub = new Subject();

	public loginForm: FormGroup;
	public STATES = STATES;
	public state = new BehaviorSubject<STATES>(STATES.READY);

	constructor(
		private router: Router,
		private fb: FormBuilder,
		public authService: AuthService) {
		this.loginForm = fb.group({
			username: ['', Validators.required],
			password: ['', Validators.required]
		});
		authService.user.pipe(takeUntil(this._ngUnsub)).subscribe(user => {
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

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}


	/**
	 * Submits the login form
	 */
	public logIn() {
		this.state.next(STATES.LOADING);
		const user: User = this.loginForm.getRawValue();
		this.authService.login(user).pipe(
			catchError((error: HttpErrorResponse) => {
				this.state.next((error && error.status >= 400 && error.status < 500)
					? STATES.TRY_AGAIN
					: STATES.TIMED_OUT
				);
				return of(false);
			})
		).subscribe((loggedIn) => {
			// Check if we're NOT logged in, and in loading state (which means we didn't error out)
			if (!loggedIn && this.state.getValue() === STATES.LOADING) {
				this.state.next(STATES.TRY_AGAIN);
				return;
			}
			this.router.navigateByUrl('/');
		});
	}
}
