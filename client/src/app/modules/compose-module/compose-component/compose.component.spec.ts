// Testing
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, DebugElement, Component } from '@angular/core';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';

// Material
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@app/modules/material.module';
import { MatSelectChange } from '@angular/material/select';
import { CommonModule } from '@app/modules//common-module/common.module';

// Types and env
import { env } from '@env';
import { Content, StatusMessage } from '@types';

// Self
import { ComposeComponent } from './compose.component';
import { HttpService } from '@app/services/http/http.service';
import { ModalService } from '@app/services/utility/modal.service';
import { StorageService } from '@app/services/utility/storage.service';
import { DatePipe } from '@angular/common';

// Rxjs
import { of } from 'rxjs';


@Component({ template: '' })
class BlankComponent { }

describe('ComposeComponent', () => {
	let component: ComposeComponent;
	let fixture: ComponentFixture<ComposeComponent>;
	let routerSpy: jasmine.SpyObj<Router>;
	let modalSpy: jasmine.SpyObj<ModalService>;
	let route: ActivatedRoute;
	let httpTestingController: HttpTestingController;
	let debug: DebugElement;

	const createNewFixture = () => {
		if (!!fixture) { fixture.destroy(); }
		fixture = TestBed.createComponent(ComposeComponent);
		component = fixture.componentInstance;
		debug = fixture.debugElement;
		fixture.detectChanges();
	};

	beforeEach(async(() => {
		modalSpy = jasmine.createSpyObj<ModalService>(
			'ModalService',
			['openDeactivateComposeModal', 'openHTTPErrorModal', 'openRestoreOldVersionModal']
		);
		modalSpy.openRestoreOldVersionModal.and.returnValue({ afterClosed: () => of(true) } as any);
		modalSpy.openHTTPErrorModal.and.returnValue({ afterClosed: () => of(false) } as any);
		modalSpy.openDeactivateComposeModal.and.returnValue({ afterClosed: () => of(false) } as any);

		const useRouterSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
		(useRouterSpy.url as any) = '/compose';

		const mockActivatedRoute = { snapshot: { params: { route: '' } } };

		let tabIndex = '0';
		const mockStorageService = { getSession: () => tabIndex, setSession: (x: string) => { tabIndex = x; } };

		TestBed.configureTestingModule({
			declarations: [ComposeComponent, BlankComponent],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				HttpService,
				{ provide: ActivatedRoute, useValue: mockActivatedRoute },
				{ provide: Router, useValue: useRouterSpy },
				{ provide: ModalService, useValue: modalSpy },
				{ provide: StorageService, useValue: mockStorageService },
				FormBuilder,
				DatePipe
			],
			imports: [
				NoopAnimationsModule,
				RouterTestingModule,
				ReactiveFormsModule,
				MaterialModule,
				CommonModule,
				HttpClientTestingModule
			]
		}).compileComponents();

		httpTestingController = TestBed.inject(HttpTestingController);

		createNewFixture();


		routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
		routerSpy.navigateByUrl.and.callFake(((newUrl: string) => {
			const canDeactivate = component.canDeactivate();
			if (!newUrl.startsWith('/')) { newUrl = '/' + newUrl; }		// make sure it always has a leading /.
			if (newUrl === '/') { newUrl = ''; }						// unless that leading / is the only value there is.

			if (canDeactivate === true) {
				(routerSpy.url as any) = newUrl;
				return Promise.resolve(true);
			}
			return new Promise(resolve => {
				canDeactivate.subscribe((res: boolean) => {
					if (!!res) { (routerSpy.url as any) = newUrl; }
					resolve(!!res);
				});
			});
		}));

		route = TestBed.inject(ActivatedRoute);
	}));

	afterEach(async(() => {
		fixture.destroy();
	}));


	describe('Component', () => {
		it('should create', () => {
			expect(component).toBeTruthy();
		});
	});


	describe('Form hooks & dynamic template checks', () => {
		it('should automatically fill in route when route is NOT dirty', () => {
			const titleInputEl: HTMLInputElement = fixture.nativeElement.querySelector('#title');
			const routeInputEl: HTMLInputElement = fixture.nativeElement.querySelector('#route');

			titleInputEl.value = 'title test';
			titleInputEl.dispatchEvent(new Event('input'));
			fixture.detectChanges();

			expect(routeInputEl.value)
				.toBe('title test', 'route should mirror title when not dirty');


			routeInputEl.value = 'I am now dirty';
			routeInputEl.dispatchEvent(new Event('input'));
			fixture.detectChanges();

			titleInputEl.value = 'second title test';
			titleInputEl.dispatchEvent(new Event('input'));
			fixture.detectChanges();

			expect(routeInputEl.value).toBe('I am now dirty', 'route should not mirror title after being dirty');
		});

		it('should automatically disable & enable folder when changes to nav occurs', () => {
			const folderEl: HTMLInputElement = fixture.nativeElement.querySelector('#folder');

			expect(folderEl.disabled).toBe(!component.ContentForm.get('nav').value, 'folder enabled state should mirror nav value on init');

			component.ContentForm.get('nav').setValue(true);
			fixture.detectChanges();

			expect(folderEl.disabled).toBe(false, 'folder should be enabled when nav is set to true');


			component.ContentForm.get('nav').setValue(false);
			fixture.detectChanges();

			expect(folderEl.disabled).toBe(true, 'folder should be disabled when nav is set to false');
		});

		it('should only enable submit button when form is valid', () => {
			const submitEl: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');

			expect(submitEl.disabled).toBe(true, 'Submit button should not be enabled on load -- the user has not filled in required fields');

			component.ContentForm.setValue({
				title: 'title',
				route: 'route',
				description: 'desc',
				content: '<p>content</p>',
				published: true,
				access: [],
				folder: '',
				nav: true,
				tags: []
			} as Content);
			fixture.detectChanges();

			expect(submitEl.disabled).toBe(false, 'Submit button should be enabled after required fields has been filled');

			component.ContentForm.patchValue({
				title: '', // set title below required again
			} as Content);
			fixture.detectChanges();

			expect(submitEl.disabled).toBe(true, 'Submit button should be disabled again after required fields has been reduced below requirements');
		});
	});


	describe('Edit existing content', () => {
		it('should query for existing data when given a route', () => {
			route.snapshot.params = { route: 'someRoute' } as Params;

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			createNewFixture();

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			const contentReq = httpTestingController.expectOne(`${env.API.admin.cms}/${route.snapshot.params.route as string}`);
			const historyReq = httpTestingController.expectOne(`${env.API.tools.history}/${route.snapshot.params.route as string}`);

			const loadedContent: Content = {
				content: '<p>some content</p>',
				title: 'some title',
				route: route.snapshot.params.route,
				description: 'some desc',
				published: true,
				nav: true,
				access: [],
				folder: '',
				tags: []
			};

			const historyCopy1 = Object.assign({}, loadedContent);
			historyCopy1.description = 'history changed once';
			const historyCopy2 = Object.assign({}, loadedContent);
			historyCopy2.description = 'history changed twice';
			const historyCopy3 = Object.assign({}, loadedContent);
			historyCopy3.description = 'history changed thrice';


			contentReq.flush(loadedContent);
			historyReq.flush([historyCopy1, historyCopy2, historyCopy3]);

			httpTestingController.verify();

			fixture.detectChanges();

			const titleInputEl: HTMLInputElement = fixture.nativeElement.querySelector('#title');
			const routeInputEl: HTMLInputElement = fixture.nativeElement.querySelector('#route');

			expect(titleInputEl.value).toBe('some title', 'title should be filled in');
			expect(routeInputEl.value).toBe(route.snapshot.params.route, 'route should mirror the route requested');

			expect(component.HistoryHandler.HistoryList).toBeTruthy('HistoryList should exist');

			const submitEl: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
			expect(submitEl.disabled).toBe(false, 'Submit button should be enabled on load -- loaded content should be valid');

			expect(component.HistoryHandler.HistoryList).toBeTruthy('HistoryList should exist in the component state');
			expect(component.HistoryHandler.HistoryList).toContain(historyCopy1, 'HistoryList should contain historyCopy1');
			expect(component.HistoryHandler.HistoryList).toContain(historyCopy2, 'HistoryList should contain historyCopy2');
			expect(component.HistoryHandler.HistoryList).toContain(historyCopy3, 'HistoryList should contain historyCopy3');
			expect(component.HistoryHandler.HistoryList).not.toContain(loadedContent, 'HistoryList should NOT contain the loaded content');
		});
	});


	describe('Submitting', () => {
		it('should receive error modal if something went wrong during submit', () => {
			component.ContentForm.setValue({
				content: '<p>some content</p>',
				title: 'some title',
				route: 'newRoute',
				description: 'some desc',
				published: false, // Published set to false
				nav: true,
				access: [],
				folder: '',
				tags: []
			} as Content);

			component.submitForm();
			fixture.detectChanges();

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			httpTestingController.expectOne(env.API.cms).flush(
				{ message: 'Something went wrong' } as StatusMessage,
				{ status: 400, statusText: 'Bad Request' }
			);

			fixture.detectChanges();

			const spy = TestBed.inject(ModalService).openHTTPErrorModal as jasmine.Spy;
			expect(spy.calls.first()).toBeTruthy('should opened http error modal');
		});

		it('should create content when submitting form when starting with an empty form', () => {
			component.ContentForm.setValue({
				content: '<p>some content</p>',
				title: 'some title',
				route: 'newRoute',
				description: 'some desc',
				published: true,
				nav: true,
				access: [],
				folder: '',
				tags: []
			} as Content);

			fixture.detectChanges();

			const submitEl: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');

			submitEl.click();
			submitEl.dispatchEvent(new Event('click'));
			fixture.detectChanges();

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			const createReq = httpTestingController.expectOne(env.API.cms);
			httpTestingController.verify();

			createReq.flush(component.ContentForm.getRawValue());
			fixture.detectChanges();

			expect(routerSpy.url).toBe('/newRoute', 'Should be routed to the content that was created');
		});

		it('should update content when submitting form for some given route', () => {
			route.snapshot.params = { route: 'someRoute' } as Params;

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			createNewFixture();

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			httpTestingController.expectOne(`${env.API.admin.cms}/${route.snapshot.params.route as string}`).flush({
				content: '<p>some content</p>',
				title: 'some title',
				route: route.snapshot.params.route,
				description: 'some desc',
				published: true,
				nav: true,
				access: [],
				folder: '',
			} as Content);
			httpTestingController.expectOne(`${env.API.tools.history}/${route.snapshot.params.route as string}`).flush(null as Content[]);

			httpTestingController.verify();
			fixture.detectChanges();

			component.ContentForm.get('route').setValue('someOtherRoute');
			fixture.detectChanges();

			const submitEl: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
			submitEl.click();
			submitEl.dispatchEvent(new Event('click'));
			fixture.detectChanges();

			const updateReq = httpTestingController.expectOne(
				`${env.API.cms}/${route.snapshot.params.route as string}`,
				'should update with the original route'
			);
			updateReq.flush(component.ContentForm.getRawValue());

			// httpTestingController.verify();		GET /api/cms
			fixture.detectChanges();

			expect(routerSpy.url).toBe('/someOtherRoute', 'Should be routed to the content that was updated');
		});
	});


	describe('Navigation', () => {
		it('should navigate to home when creating content that is set as not published', () => {
			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			httpTestingController.verify();

			component.ContentForm.setValue({
				content: '<p>some content</p>',
				title: 'some title',
				route: 'newRoute',
				description: 'some desc',
				published: false, // Published set to false
				nav: true,
				access: [],
				folder: '',
				tags: []
			} as Content);

			component.submitForm();
			fixture.detectChanges();

			expect(routerSpy.url).toBe('/compose', 'we should be at the compose route prior to submitting');

			httpTestingController.expectOne(env.API.cms).flush(component.ContentForm.getRawValue());
			fixture.detectChanges();

			expect(routerSpy.url).toBe('', 'Should be routed to home if the content is set to not published');
		});

		it('should guard against routing away when form is dirty', () => {
			expect(component.ContentForm.dirty).toBe(false, 'Form should initially not be dirty');
			expect(routerSpy.url).toBe('/compose', 'should be at the compose route initially');

			const descInputEl: HTMLInputElement = fixture.nativeElement.querySelector('#desc');
			descInputEl.value = 'I typed something here';
			descInputEl.dispatchEvent(new Event('input'));

			fixture.detectChanges();

			expect(component.ContentForm.dirty).toBe(true, 'Form should should be marked as dirty now');

			// NAVIGATE
			routerSpy.navigateByUrl('/');
			fixture.detectChanges();

			expect(routerSpy.url).toBe('/compose', 'should not yet have routed away; guard should have triggered');
			expect(modalSpy.openDeactivateComposeModal.calls.first()).toBeTruthy('should have opened deactivate guard modal');
		});

		it('should NOT guard against routing away when form is untouched or pristine', () => {
			expect(component.ContentForm.dirty).toBe(false, 'Form should initially not be dirty');
			expect(routerSpy.url).toBe('/compose', 'should initially be on the compose route');

			// NAVIGATE
			routerSpy.navigateByUrl('/');
			fixture.detectChanges();

			const spy = TestBed.inject(ModalService).openDeactivateComposeModal as jasmine.Spy;
			expect(spy.calls.first()).toBeFalsy('should not have attempted to guard us from leaving');
			expect(routerSpy.url).toBe('', 'should have routed away');
		});
	});


	describe('History', () => {
		it('should preserve draft state between history selection change', () => {
			route.snapshot.params = { route: 'someRoute' } as Params;

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			createNewFixture();

			fixture.detectChanges();

			const loadedContent: Content = {
				content: '<p>some content</p>',
				title: 'some title',
				route: route.snapshot.params.route,
				description: 'some desc',
				published: true,
				nav: true,
				access: [],
				folder: '',
				tags: []
			};
			httpTestingController.expectOne(`${env.API.admin.cms}/${route.snapshot.params.route as string}`).flush(loadedContent);

			const historyCopy1 = Object.assign({}, loadedContent);
			historyCopy1.description = 'history changed once';
			const historyCopy2 = Object.assign({}, loadedContent);
			historyCopy2.description = 'history changed twice';
			const historyCopy3 = Object.assign({}, loadedContent);
			historyCopy3.description = 'history changed thrice';

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			httpTestingController.expectOne(`${env.API.tools.history}/${route.snapshot.params.route as string}`)
				.flush([historyCopy1, historyCopy2, historyCopy3]);

			httpTestingController.verify();
			fixture.detectChanges();

			expect(component.HistoryHandler.HistoryList).toBeTruthy('HistoryList should exist in the component state');
			expect(component.ContentForm.valid).toBe(true, 'Form should be valid upon loading initial data');
			expect(component.ContentForm.enabled).toBe(true, 'Form should be enabled upon loading initial data');

			const descInputEl: HTMLInputElement = fixture.nativeElement.querySelector('#desc');
			expect(descInputEl.value).toBe('some desc', 'DOM desc input should loaded with inital data');

			// MAKE CHANGES TO OUR DRAFT
			descInputEl.value = 'I typed something here';
			descInputEl.dispatchEvent(new Event('input'));
			fixture.detectChanges();

			// CHANGE HISTORY ITEM TO HISTORY ITEM AT INDEX 0
			component.HistoryHandler.HistoryVersionIndex = 0;
			component.onSetStateAsHistroyFromVersion(new MatSelectChange(null, 0));
			fixture.detectChanges();

			expect(descInputEl.value).toBe('history changed once', 'DOM desc input should loaded with history item at index 0');
			expect(component.ContentForm.enabled).toBe(false, 'Form should be disabled during viewing of history data');

			// CHANGE HISTORY ITEM TO HISTORY ITEM AT INDEX 1
			component.HistoryHandler.HistoryVersionIndex = 1;
			component.onSetStateAsHistroyFromVersion(new MatSelectChange(null, 1));
			fixture.detectChanges();

			expect(descInputEl.value).toBe('history changed twice', 'DOM desc input should loaded with history item at index 1');
			expect(component.ContentForm.enabled).toBe(false, 'Form should be disabled during viewing of history data');

			// CHANGE HISTORY ITEM TO HISTORY ITEM AT INDEX 2
			component.HistoryHandler.HistoryVersionIndex = 2;
			component.onSetStateAsHistroyFromVersion(new MatSelectChange(null, 2));
			fixture.detectChanges();

			expect(descInputEl.value).toBe('history changed thrice', 'DOM desc input should loaded with history item at index 2');
			expect(component.ContentForm.enabled).toBe(false, 'Form should be disabled during viewing of history data');

			// CHANGE HISTORY ITEM TO DRAFT
			component.HistoryHandler.HistoryVersionIndex = component.HistoryHandler.VersionHistory.Draft;
			component.onSetStateAsHistroyFromVersion(new MatSelectChange(null, component.HistoryHandler.VersionHistory.Draft));
			fixture.detectChanges();

			expect(descInputEl.value).toBe('I typed something here', 'state should have remembered the value of the ongoing draft');
			expect(component.ContentForm.enabled).toBe(true, 'Form should be enabled again when we\'re back to drafting');
		});

		it('should set draft state to the history item when restoring history', () => {
			route.snapshot.params = { route: 'someRoute' } as Params;

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			createNewFixture();

			fixture.detectChanges();

			httpTestingController.expectOne(env.API.tools.tags).flush([]);
			const contentReq = httpTestingController.expectOne(`${env.API.admin.cms}/${route.snapshot.params.route as string}`);
			const historyReq = httpTestingController.expectOne(`${env.API.tools.history}/${route.snapshot.params.route as string}`);

			const loadedContent: Content = {
				content: '<p>some content</p>',
				title: 'some title',
				route: route.snapshot.params.route,
				description: 'some desc',
				published: true,
				nav: true,
				access: [],
				folder: '',
				tags: []
			};

			const historyCopy1 = Object.assign({}, loadedContent);
			historyCopy1.description = 'history changed once';
			const historyCopy2 = Object.assign({}, loadedContent);
			historyCopy2.description = 'history changed twice';
			const historyCopy3 = Object.assign({}, loadedContent);
			historyCopy3.description = 'history changed thrice';

			contentReq.flush(loadedContent);
			historyReq.flush([historyCopy1, historyCopy2, historyCopy3]);

			httpTestingController.verify();

			const descInputEl: HTMLInputElement = fixture.nativeElement.querySelector('#desc');

			fixture.detectChanges();

			expect(descInputEl.value).toBe('some desc', 'DOM desc input should loaded with inital data');

			// CHANGE HISTORY ITEM TO HISTORY ITEM AT INDEX 2
			component.HistoryHandler.HistoryVersionIndex = 2;
			component.onSetStateAsHistroyFromVersion(new MatSelectChange(null, 2));
			fixture.detectChanges();

			expect(descInputEl.value).toBe('history changed thrice', 'DOM desc input should loaded with history item at index 2');
			expect(component.ContentForm.enabled).toBe(false, 'Form should be disabled during viewing of history data');
			expect(component.ContentForm.dirty).toBe(false, 'Nothing has been changed be the user -- the form should not be dirty');

			const restoreEl: HTMLButtonElement = fixture.nativeElement.querySelector('#restore');
			restoreEl.click();
			restoreEl.dispatchEvent(new Event('click'));

			fixture.detectChanges();

			expect(modalSpy.openRestoreOldVersionModal.calls.first()).toBeTruthy('should have opened restore old version modal');

			expect(component.ContentForm.enabled).toBe(true, 'Form should be enabled for editing when restoring a previous version');
			expect(component.ContentForm.dirty).toBe(true, 'We have now restored a previous version. This should mark the form as dirty');
		});
	});
});
