import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { MatSnackBar } from '@angular/material';

import { env } from '@env';

import { TokenService } from '@app/services/utility/token.service';
import { LoadingService } from '@app/services/utility/loading.service';

import { Observable, of, throwError, TimeoutError } from 'rxjs';
import { timeout, finalize, catchError } from 'rxjs/operators';


@Injectable()
export class InterceptorService implements HttpInterceptor {

	constructor(
		private tokenService: TokenService,
		private loadingService: LoadingService,
		private snackBar: MatSnackBar) {
	}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Only intercept if the request is going to our server.
		if (!req.url.startsWith(env.API_BASE + env.API.api)) { return next.handle(req); }
		// Add Headers
		let headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
		const token = this.tokenService.token;
		if (token) { headers = headers.set('Authorization', token); }

		// Add request
		this.loadingService.addRequest();

		// Send it off to the next handle
		return next.handle(req.clone({ headers: headers, withCredentials: true })).pipe(
			timeout(env.TIMEOUT), // Set global TIMEOUT for all API calls
			finalize(() => this.loadingService.removeRequest()),
			catchError((err: HttpErrorResponse | TimeoutError, caught) => {
				if (err instanceof TimeoutError) {
					this.openSnackBar('Request timed out');
					return throwError('Request timed out');
				}
				// Any non-timed-out request has to be handled from where it originated
				return throwError(err.message);
			})
		);
	}


	/**
	 * Opens a snackbar with the given message and action message
	 * @param  {string} message The message that is to be displayed
	 * @param  {string} action  the action message that is to be displayed
	 */
	private openSnackBar(message: string, action?: string) {
		this.snackBar.open(message, action, {
			duration: 5000,
		});
	}
}
