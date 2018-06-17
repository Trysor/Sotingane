import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SEOComponent } from './seo.component';

describe('SEOComponent', () => {
	let component: SEOComponent;
	let fixture: ComponentFixture<SEOComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SEOComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SEOComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
