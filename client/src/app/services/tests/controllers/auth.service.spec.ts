import { TestBed } from '@angular/core/testing';

// Http
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
const httpServiceSpy = jasmine.createSpyObj<HttpService>('HttpService', ['client', 'apiUrl']);

// Material
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@app/modules';

// Routing
const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
import { Router } from '@angular/router';

import { AuthService, HttpService } from '@app/services';
import { User, TokenResponse } from '@types';

import { env } from '@env';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

describe('AuthService', () => {
	let service: AuthService;
	let httpTestingController: HttpTestingController;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [
				{ provide: HttpService, useValue: httpServiceSpy },
				{ provide: Router, useValue: routerSpy },
				AuthService
			],
			imports: [
				NoopAnimationsModule,
				MaterialModule,
				HttpClientTestingModule
			]
		});
		service = TestBed.get(AuthService);
		httpTestingController = TestBed.get(HttpTestingController);

		// Override the client property to use the test client
		(<any>service).http.client = TestBed.get(HttpClient);

		// skip api base etc
		TestBed.get(HttpService).apiUrl.and.callFake((api: string) => api);
	});


	beforeEach(() => {
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
		req.flush(<TokenResponse>{ // tslint:disable:max-line-length
			token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjk0NjY4NDgwMCwiZXhwIjozMjUwMzY4MDAwMCwiYXVkIjoiIiwic3ViIjoidGVzdCIsIl9pZCI6IjEyMzQ1NiIsInVzZXJuYW1lIjoidGVzdCIsInJvbGUiOiJhZG1pbiJ9.uI0Z1CmNRGBxG5HxC_UHZCbsx_kJ0CvRqRuy2YG-Zu0',
			user: testUser
		}); // tslint:enable:max-line-length
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
