import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { env } from '@env';

import { TokenService } from '@app/services/utility/token.service';
import { LoadingService } from '@app/services/utility/loading.service';
import { SnackBarService } from '@app/services/utility/snackbar.service';

import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, finalize, catchError } from 'rxjs/operators';


@Injectable()
export class InterceptorService implements HttpInterceptor {

	constructor(
		private tokenService: TokenService,
		private loadingService: LoadingService,
		private snackBar: SnackBarService) {
	}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Only intercept if the request is going to our server.
		if (!req.url.startsWith(env.API_BASE + env.API.api)) { return next.handle(req); }

		// Add Headers
		let headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
		let token: string;
		if (req.url.startsWith(env.API_BASE + env.API.auth.token)) {
			token = this.tokenService.refreshToken;
		} else {
			token = this.tokenService.token;
		}
		if (token) { headers = headers.set('Authorization', token); }

		// Add request
		this.loadingService.addRequest();

		// Send it off to the next handle
		return next.handle(req.clone({ headers: headers, withCredentials: true })).pipe(
			timeout(env.TIMEOUT), // Set global TIMEOUT for all API calls
			finalize(() => this.loadingService.removeRequest()),
			catchError((err: HttpErrorResponse | TimeoutError, caught) => {
				if (err instanceof TimeoutError) {
					this.snackBar.open('Request timed out');
					return throwError('Request timed out');
				}
				// Any non-timed-out request has to be handled from where it originated
				return throwError(err);
			})
		);
	}
}
