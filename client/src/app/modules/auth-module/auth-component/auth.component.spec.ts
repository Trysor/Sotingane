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
import { Observable } from 'rxjs/Observable';
import { map, catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
	let component: AuthComponent;
	let fixture: ComponentFixture<AuthComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [AuthComponent],
			imports: [
				BrowserAnimationsModule,
				MaterialModule,
				ReactiveFormsModule,
				RouterTestingModule,
				HttpClientModule
			],
			// providers: [ { provide: AuthService, useValue: authServiceStub } ]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AuthComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
