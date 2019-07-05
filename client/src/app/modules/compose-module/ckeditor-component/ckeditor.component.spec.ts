// Testing
import { async, ComponentFixture, TestBed, fakeAsync, discardPeriodicTasks } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

// Material
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Self
import { CKEDitorComponent } from './ckeditor.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';


describe('CKEDitorComponent', () => {
	let component: CKEDitorComponent;
	let fixture: ComponentFixture<CKEDitorComponent>;
	let debug: DebugElement;

	let editor: any;


	beforeEach(fakeAsync(async () => {
		TestBed.configureTestingModule({
			declarations: [CKEDitorComponent],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [],
			imports: [
				NoopAnimationsModule,
				ReactiveFormsModule,
				CKEditorModule
			]
		}).compileComponents();

		fixture = TestBed.createComponent(CKEDitorComponent);
		component = fixture.componentInstance;
		debug = fixture.debugElement;

		// Create form
		component.form = new FormGroup({
			content: new FormControl('')
		});

		fixture.detectChanges();

		editor = await component.Editor.toPromise(); // Aquire the editor instance
		discardPeriodicTasks(); // Discard tasks set by the CKEditor Angular component by the CK team
	}));

	afterEach(() => {
		// if (!!editor) { editor.destroy(); }
		fixture.destroy();
	});


	it('should create', async(async () => {
		await fixture.whenStable();
		expect(component.ClassicEditor).toBeTruthy('The CKEditor should exist on the component');
		expect(editor).toBeDefined('The editor should have been created');
		expect(component).toBeTruthy();
	}));

	it('should update content when setting data through CKEditor', async(async () => {
		await fixture.whenStable();

		const el: HTMLElement = fixture.nativeElement.querySelector('#content .ck-content');
		expect(el).toBeDefined('CKEditor should be defined in DOM');

		// SET DATA
		editor.setData('<p>hello world!</p>');
		fixture.detectChanges();

		expect(component.form.get('content').value).toContain('<p>hello world!</p>',
			'The form should have been updated with content from CKEditor');
	}));
});
