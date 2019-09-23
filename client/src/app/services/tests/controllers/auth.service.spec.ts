import { TestBed } from '@angular/core/testing';

// Http
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TransferState } from '@angular/platform-browser';

// Material
import { MaterialModule } from '@app/modules';

// Routing
import { Router } from '@angular/router';
const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

import { AuthService, HttpService } from '@app/services';
import { User, TokenResponse } from '@types';

import { env } from '@env';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

describe('AuthService', () => {
	let service: AuthService;
	let httpTestingController: HttpTestingController;

	beforeEach(() => {
		const httpServiceSpy = jasmine.createSpyObj<HttpService>('HttpService', ['client']);

		// Use our spies in the module
		TestBed.configureTestingModule({
			providers: [
				{ provide: HttpService, useValue: httpServiceSpy },
				{ provide: Router, useValue: routerSpy },
				TransferState,
				AuthService
			],
			imports: [
				MaterialModule,
				HttpClientTestingModule
			]
		});

		// Override the client property to use the test client
		// This needs to happen before we do TestBed.inject(AuthService);
		(TestBed.inject(HttpService) as any).client = TestBed.inject(HttpClient);

		// Get the service, and the httpTestingController, so we can use these in our tests
		service = TestBed.inject(AuthService);
		httpTestingController = TestBed.inject(HttpTestingController);

		// Deal with the refresh token request from the constructor (moved to SetupService)
		// const req = httpTestingController.expectOne(r => r.url.includes(env.API.auth.token));
		// req.flush({});

		service.user.next(null); // Reset user to null
	});

	afterEach(() => {
		httpTestingController.verify(); // After every test, assert that there are no more pending requests.
	});

	it('login()', () => {
		const testUser: User = { username: 'test', password: 'pass', _id: null };
		 /* { "iss": "", "iat": 946684800, "exp": 32503680000, "aud": "", "sub": "test",
			"_id": "123456", "username": "test", "role": "admin" }  */

		// Subscribe to request
		service.login(testUser).subscribe(success => {
			// Once a reply is given, test that it is correct
			expect(success).toBe(true, 'Should have logged in successfully');
			expect(service.user.getValue().username).toBe(testUser.username, 'should have set test user');
		});

		// Expect a request to be made
		const req = httpTestingController.expectOne(env.API.auth.login);
		expect(req.request.method).toEqual('POST');

		// Reply with test data
		req.flush({
			token: 'someToken',
			user: testUser
		} as TokenResponse);
	});

	it('login() fail', () => {
		const testUser: User = { username: 'test', password: 'pass', _id: null };

		// Subscribe to request
		service.login(testUser).pipe(
			catchError((error: HttpErrorResponse) => {
				// Once a reply is given, test that it is correct
				expect(error.status).toBe(401, 'Should not have logged in');
				expect(service.user.getValue()).toBe(null, 'should NOT have set user');

				return of(false);
			})
		).subscribe(success => {
			if (success) { fail('a status 401 should never enter the success handler'); }
		});

		// Expect a request to be made
		const req = httpTestingController.expectOne(env.API.auth.login);
		expect(req.request.method).toEqual('POST');

		req.flush({}, { status: 401, statusText: 'unauthorized' });

		httpTestingController.expectNone(env.API.auth.login, 'Login route should have resolved');
	});

});
