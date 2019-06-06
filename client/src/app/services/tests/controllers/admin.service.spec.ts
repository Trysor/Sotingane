import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';

import { AdminService, HttpService } from '@app/services';
import { User, Content } from '@types';

import { env } from '@env';


describe('AdminService', () => {
	let service: AdminService;
	let httpTestingController: HttpTestingController;

	beforeEach(() => {
		const spy = jasmine.createSpyObj<HttpService>('HttpService', ['client', 'apiUrl',]);

		TestBed.configureTestingModule({
			providers: [
				{ provide: HttpService, useValue: spy },
				AdminService
			],
			imports: [HttpClientTestingModule]
		});
		service = TestBed.get(AdminService);
		httpTestingController = TestBed.get(HttpTestingController);

		// Override the client property to use the test client
		(<any>service).http.client = TestBed.get(HttpClient);

		// skip api base etc
		TestBed.get(HttpService).apiUrl.and.callFake((api: string) => api);
	});

	afterEach(() => {
		// After every test, assert that there are no more pending requests.
		httpTestingController.verify();
	});


	it('getAllusers()', () => {
		const testUsers: User[] = [{ username: 'Bob', _id: null }, { username: 'Alice', _id: null }];

		// Subscribe to request
		service.getAllusers().subscribe(users => {
			// Once a reply is given, test that it is correct
			expect(users).toBe(testUsers, 'should contain test users');
		});

		// Expect a request to be made
		const req = httpTestingController.expectOne(env.API.admin.users);
		expect(req.request.method).toEqual('GET');

		// Reply with test data
		req.flush(testUsers);
	});


	it('patchUser()', () => {
		const testUser: User = { _id: 'someId', username: 'Bob' };

		// Subscribe to request
		service.patchUser(testUser).subscribe(success => {
			// Once a reply is given, test that it is correct
			expect(success).toBeTruthy('should return object');
		});

		// Expect a request to be made
		const req = httpTestingController.expectOne(env.API.admin.users + '/' + testUser._id);
		expect(req.request.method).toEqual('PATCH');

		// Reply with success state
		req.flush({ message: 'success' });
	});


	it('getAllContent()', () => {
		const testContent: Content[] = [
			{ title: 'test', route: 'test' },
			{ title: 'test2', route: 'test2' },
		];

		// Subscribe to request
		service.getAllContent().subscribe(content => {
			// Once a reply is given, test that it is correct
			expect(content).toBe(testContent, 'should contain test content');
		});

		// Expect a request to be made
		const req = httpTestingController.expectOne(env.API.admin.cms);
		expect(req.request.method).toEqual('GET');

		// Reply with test data
		req.flush(testContent);
	});

	it('getContentPage()', () => {
		const testContent: Content = { title: 'test', route: 'test' };

		// Subscribe to request
		service.getContentPage(testContent.route).subscribe(content => {
			// Once a reply is given, test that it is correct
			expect(content).toBe(testContent, 'should contain test content');
		});

		// Expect a request to be made
		const req = httpTestingController.expectOne(env.API.admin.cms + '/' + testContent.route);
		expect(req.request.method).toEqual('GET');

		// Reply with test data
		req.flush(testContent);
	});
});
