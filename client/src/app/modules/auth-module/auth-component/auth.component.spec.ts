import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, Injectable, Component } from '@angular/core';


import { MobileService } from '@app/services';
import { mobileServiceStub } from '@app/services/stubs';

import { AuthComponent } from './auth.component';



@Component({ selector: 'login-component', template: '<div><p>Login Component renders here</p></div>' })
class LoginStubComponent { }

describe('AuthComponent', () => {
	let component: AuthComponent;
	let fixture: ComponentFixture<AuthComponent>;
	let mobileService: MobileService;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [AuthComponent, LoginStubComponent],
			providers: [{ provide: MobileService, useValue: mobileServiceStub }],
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AuthComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		mobileService = TestBed.get(MobileService);
	});

	it('should create', () => {
		expect(component).toBeTruthy();
		const login: HTMLElement = fixture.debugElement.query(By.css('login-component')).nativeElement;
		expect(login).toBeTruthy();
	});

	it('should render desktop layout', () => {
		// Set state to desktop
		mobileService.isMobile().next(false);
		fixture.detectChanges();

		// Test desktop
		const div: HTMLElement = fixture.debugElement.query(By.css('div.auth')).nativeElement;
		expect(div).toBeTruthy();

		// Verify that the login component do NOT occupy the entire width
		const login: HTMLElement = fixture.debugElement.query(By.css('login-component')).nativeElement;
		expect(login.clientWidth).toBeLessThan(div.clientWidth, 'Login should be smaller than parent box (as it should take half width)');
	});

	it('should render mobile layout', () => {
		// Set state to mobile
		mobileService.isMobile().next(true);
		fixture.detectChanges();

		// Test mobile
		const div: HTMLElement = fixture.debugElement.query(By.css('div.auth.mobile')).nativeElement;
		expect(div).toBeTruthy();

		// Verify that the login component DOES occupy the entire width
		const login: HTMLElement = fixture.debugElement.query(By.css('login-component')).nativeElement;
		expect(login.clientWidth).toBe(div.clientWidth, 'Login box should take the full width of the parent box');
	});
});
