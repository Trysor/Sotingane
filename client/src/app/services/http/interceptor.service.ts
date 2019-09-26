import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { env } from '@env';

import { TokenService } from '@app/services/utility/token.service';
import { LoadingService } from '@app/services/utility/loading.service';
import { SnackBarService } from '@app/services/utility/snackbar.service';
import { PlatformService } from '@app/services/utility/platform.service';
import { HttpService } from '@app/services/http/http.service';

import { throwError, TimeoutError } from 'rxjs';
import { timeout, finalize, catchError } from 'rxjs/operators';


@Injectable()
export class InterceptorService implements HttpInterceptor {

	constructor(
		private http: HttpService,
		private platform: PlatformService,
		private tokenService: TokenService,
		private loadingService: LoadingService,
		private snackBar: SnackBarService) {
	}

	intercept(req: HttpRequest<any>, next: HttpHandler) {
		// Only intercept if the request is going to our server.
		if (!req.url.startsWith(env.API.api)) { return next.handle(req); }
		const shouldSetAsJson = !req.url.startsWith(env.API.files);

		// LoadingService
		this.loadingService.addRequest();

		// Handle the request, set headers and pipe it
		return next.handle(
			req.clone({
				headers: this.getHeadersObject(req, shouldSetAsJson),
				withCredentials: true,
				url: this.getAPIUrl(req)							// Deal with server vs client side URL handling
			})
		).pipe(
			timeout(env.TIMEOUT),									// Set global TIMEOUT for all API calls

			finalize(() => this.loadingService.removeRequest()),	// Remove the request from the loadbar service

			catchError((err: HttpErrorResponse | TimeoutError) => {
				if (err instanceof TimeoutError) {
					this.snackBar.open('Request timed out');
					return throwError('Request timed out');
				}
				// Any non-timed-out request has to be handled from where it originated
				return throwError(err);
			})
		);
	}

	/**
	 * Create the HttpHeaders object with headers set
	 */
	private getHeadersObject(req: HttpRequest<any>, shouldSetAsJson: boolean) {
		let headers = new HttpHeaders();
		if (req.headers.has('Content-Type')) {
			headers.set('Content-Type', req.headers.get('Content-Type'));
		} else if (shouldSetAsJson) {
			headers.set('Content-Type', 'application/json; charset=utf-8');
		}

		const token = req.url.startsWith(env.API.auth.token)
			? this.tokenService.refreshToken
			: this.tokenService.token;

		if (token) { headers = headers.set('Authorization', token); }
		return headers;
	}


	/**
	 * Returns the modified URL for the request based on the existance of a pointer to a API_BASE
	 * If API_BASE does not exist, fall back to url base on the server, and otherwise return the relative url
	 */
	private getAPIUrl(req: HttpRequest<any>) {
		if (!!env.API_BASE && env.API_BASE !== '') { return env.API_BASE + req.url; }	// Add API_BASE if exists
		if (this.platform.isServer) { return this.http.urlBase + req.url; }				// Add url base if on server
		return req.url;																	// Otherwise keep the url we've got
	}
}
