import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

// required for this specific test
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '@app/services';

import { User, AccessRoles } from '@app/models';
import { Observable, of } from 'rxjs';

import { ChangePasswordComponent } from './change.password.component';


describe('ChangePasswordComponent', () => {
	let component: ChangePasswordComponent;
	let fixture: ComponentFixture<ChangePasswordComponent>;

	const user: User = {
		_id: 'abcdefg',
		username: 'testuser',
		role: AccessRoles.admin,
	};

	const authServiceStub = {
		getUser(): Observable<User> {
			return of(user);
		}
	};

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ChangePasswordComponent],
			imports: [
				BrowserAnimationsModule,
				ReactiveFormsModule,
				RouterTestingModule,
				HttpClientModule
			],
			providers: [{ provide: AuthService, useValue: authServiceStub }]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ChangePasswordComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
