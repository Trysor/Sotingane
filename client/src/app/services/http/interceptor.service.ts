import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders, HttpResponse } from '@angular/common/http';
import { env } from '@env';

import { TokenService } from '@app/services/helpers/token.service';
import { LoadingService } from '@app/services/utility/loading.service';
import { HttpService } from '@app/services/http/http.service';


import { Observable } from 'rxjs';
import { tap, timeout, take } from 'rxjs/operators';

@Injectable()
export class InterceptorService implements HttpInterceptor {

	constructor(
		private tokenService: TokenService,
		private loadingService: LoadingService,
		private httpService: HttpService,

	) { }

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Only intercept if the request is going to our server.
		if (!req.url.startsWith(env.API_BASE + env.API.api)) { return next.handle(req); }

		// Add Headers
		let headers = new HttpHeaders().set('authorization', this.tokenService.token || '');
		headers = headers.set('Content-Type', 'application/json; charset=utf-8');

		// Add request
		this.loadingService.addRequest();

		// Send it off to the next handle
		return next.handle(req.clone({ headers: headers })).pipe(
			timeout(env.TIMEOUT),						// Set global TIMEOUT for all API calls
			take(2),											// Completes after header and response
			tap(												// Hook onto the response for loading
				(e) => { if (e instanceof HttpResponse) { this.loadingService.removeRequest(); } },
				(err) => { this.loadingService.removeRequest(); }
			),
		);
	}
}
