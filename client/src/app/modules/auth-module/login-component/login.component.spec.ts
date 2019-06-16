import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

// Material
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@app/modules';

// Routing
import { RouterTestingModule } from '@angular/router/testing';
const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
import { Router } from '@angular/router';

// Forms
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

// Services
import { AuthService } from '@app/services';
import { authServiceStub, AuthServiceStub } from '@app/services/tests/stubs';

// Self
import { LoginComponent } from './login.component';

// Rxjs
import { Subject } from 'rxjs';

describe('LoginComponent', () => {
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;
	let router: Router;
	let auth: AuthServiceStub;
	let loginSubject: Subject<boolean>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [LoginComponent],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				{ provide: AuthService, useValue: authServiceStub },
				{ provide: Router, useValue: routerSpy },
				FormBuilder
			],
			imports: [
				BrowserAnimationsModule,
				RouterTestingModule,
				ReactiveFormsModule,
				MaterialModule
			]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		auth = TestBed.get(AuthService);
		router = TestBed.get(Router);
		loginSubject = new Subject<boolean>();
		auth.login = () => loginSubject.asObservable();

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should fill form', () => {
		// Expect initial state to not be valid
		expect(component.loginForm.valid).toBe(false, 'Should not be valid initially');

		// Fill form
		component.loginForm.setValue({
			username: 'testUsername',
			password: 'testPassword',
		});
		fixture.detectChanges();

		// Fetch inputs
		const username: HTMLInputElement = fixture.debugElement.query(By.css('input[type="text"]')).nativeElement;
		const password: HTMLInputElement = fixture.debugElement.query(By.css('input[type="password"]')).nativeElement;

		// Expect form to be valid, and fields to have received their respective values
		expect(component.loginForm.valid).toBe(true, 'Should be valid after user input');
		expect(username.value).toBe('testUsername', 'Should equal username text');
		expect(password.value).toBe('testPassword', 'Should equal password text');
	});


	it('should disable login button', () => {
		const button: HTMLButtonElement = fixture.debugElement.query(By.css('.loginButton')).nativeElement;

		// Expect initial state to be disabled
		expect(button.disabled).toBe(true, 'Should be disabled (1)');

		// Fill form
		component.loginForm.setValue({
			username: 'testUsername',
			password: 'testPassword',
		});
		fixture.detectChanges();

		// Expect form to be valid (requisite for login button to be enabled) and expect button to be enabled
		expect(component.loginForm.valid).toBe(true, 'Should be valid');
		fixture.detectChanges();
		expect(button.disabled).toBe(false, 'Should be enabled');

		// Fill form
		component.loginForm.setValue({
			username: '',
			password: 'testPassword',
		});
		fixture.detectChanges();

		// Expect form to be invalid (requisite for login button to be enabled) and expect button to be disabled
		expect(component.loginForm.valid).toBe(false, 'Should be invalid (1)');
		expect(button.disabled).toBe(true, 'Should be disabled (2)');

		// Fill form
		component.loginForm.setValue({
			username: 'testUsername',
			password: '',
		});
		fixture.detectChanges();

		// Expect form to be invalid (requisite for login button to be enabled) and expect button to be disabled
		expect(component.loginForm.valid).toBe(false, 'Should be invalid (2)');
		expect(button.disabled).toBe(true, 'Should be disabled (3)');
	});



	it('should successfully login and route to home', () => {
		const button: HTMLButtonElement = fixture.debugElement.query(By.css('.loginButton')).nativeElement;

		// Expect initial state
		expect(component.state.getValue()).toBe(component.STATES.READY, 'Should be in the READY state');

		// Fill form
		component.loginForm.setValue({
			username: 'testUsername',
			password: 'testPassword',
		});
		fixture.detectChanges();

		// Click button
		button.click();
		fixture.detectChanges();

		// Expect loading state
		expect(component.state.getValue()).toBe(component.STATES.LOADING, 'Should be in the LOADING state');

		// Trigger login
		loginSubject.next(true);

		// Expect to be routed to home
		const spy = router.navigateByUrl as jasmine.Spy;
		const navArgs = spy.calls.first().args[0];
		expect(navArgs).toBe('/', 'Should be routed to "/"');
	});

	it('should successfully give error message on faulty login', () => {
		const button: HTMLButtonElement = fixture.debugElement.query(By.css('.loginButton')).nativeElement;

		// Expect error to not be visible
		// expect(errorDebugElem).toBeFalsy('Should not show mat-error on page load');

		// Fill form
		component.loginForm.setValue({
			username: 'testUsername',
			password: 'testPassword',
		});
		fixture.detectChanges();

		// Click button
		button.click();
		fixture.detectChanges();

		// Expect loading state
		expect(component.state.getValue()).toBe(component.STATES.LOADING, 'Should be in the LOADING state');

		// Trigger login
		loginSubject.next(false);
		fixture.detectChanges();

		// Expect try_again state
		expect(component.state.getValue()).toBe(component.STATES.TRY_AGAIN, 'Should be in the TRY_AGAIN state');

		// Expect error text to be visible
		const errorDebugElement: DebugElement = fixture.debugElement.query(By.css('mat-error'));
		expect(errorDebugElement).toBeDefined('Should have an error message on screen');
	});

	it('should successfully give error message on faulty login: http error', () => {
		const button: HTMLButtonElement = fixture.debugElement.query(By.css('.loginButton')).nativeElement;
		const errorDebugElem = fixture.debugElement.query(By.css('mat-error'));

		// Expect error to not be visible
		expect(errorDebugElem).toBeFalsy('Should not show mat-error on page load');

		// Fill form
		component.loginForm.setValue({
			username: 'testUsername',
			password: 'testPassword',
		});
		fixture.detectChanges();

		// Click button
		button.click();
		fixture.detectChanges();

		// Expect loading state
		expect(component.state.getValue()).toBe(component.STATES.LOADING, 'Should be in the LOADING state');

		// Trigger login
		loginSubject.error(new HttpErrorResponse({ status: 401 }));
		fixture.detectChanges();

		// Expect try_again state
		expect(component.state.getValue()).toBe(component.STATES.TRY_AGAIN, 'Should be in the TRY_AGAIN state');

		// Expect error text to be visible
		const error: HTMLElement = fixture.debugElement.query(By.css('mat-error')).nativeElement;
		expect(error).toBeDefined('Should have an error message on screen');
	});


	it('should successfully give error message on faulty login: timeout', () => {
		const button: HTMLButtonElement = fixture.debugElement.query(By.css('.loginButton')).nativeElement;
		const errorDebugElem = fixture.debugElement.query(By.css('mat-error'));

		// Expect error to not be visible
		expect(errorDebugElem).toBeFalsy('Should not show mat-error on page load');

		// Fill form
		component.loginForm.setValue({
			username: 'testUsername',
			password: 'testPassword',
		});
		fixture.detectChanges();

		// Click button
		button.click();
		fixture.detectChanges();

		// Expect loading state
		expect(component.state.getValue()).toBe(component.STATES.LOADING, 'Should be in the LOADING state');

		// Trigger login
		loginSubject.error({}); // Timed out
		fixture.detectChanges();

		// Expect try_again state
		expect(component.state.getValue()).toBe(component.STATES.TIMED_OUT, 'Should be in the TIMED_OUT state');

		// Expect error text to be visible
		const error: HTMLElement = fixture.debugElement.query(By.css('mat-error')).nativeElement;
		expect(error).toBeDefined('Should have an error message on screen');
	});
});
