import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

// required for this specific test
import { MaterialModule } from '@app/modules/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '@app/services/controllers/auth.service';

import { User } from '@app/models/user';
import { Observable, of } from 'rxjs';

import { UserComponent } from './user.component';


describe('UserComponent', () => {
	let component: UserComponent;
	let fixture: ComponentFixture<UserComponent>;

	const authServiceStub = {
		// getUser(): Observable<User> {
		//  return of({
		//    _id: 'abcdefg',
		//    username: 'testuser',
		//    role: 'admin',
		//  });
		// }
	};

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [UserComponent],
			imports: [
				BrowserAnimationsModule,
				MaterialModule,
				ReactiveFormsModule,
				RouterTestingModule,
				HttpClientModule
			],
			providers: [{ provide: AuthService, useValue: authServiceStub }]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(UserComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
