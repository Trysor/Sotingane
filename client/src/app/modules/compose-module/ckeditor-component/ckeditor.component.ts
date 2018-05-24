import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Renderer2, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';

// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import ClassicEditor from '@app-ckeditor';

@Component({
	selector: 'ck-editor',
	templateUrl: './ckeditor.component.html',
	styleUrls: ['./ckeditor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CKEditorComponent implements OnInit, OnDestroy {
	// editor
	@ViewChild('content') editorBox: ElementRef<HTMLTextAreaElement>;
	private _editor: CKEditor;
	private _control: FormControl;

	private _updateFromForm = false;
	private _updateFromEditor = false;

	@Input() public set control(value: FormControl) {
		if (this._control) { return; }
		this._control = value;
	}

	constructor(private renderer: Renderer2) { }

	ngOnInit() {
		if (typeof ClassicEditor === 'undefined') { return; }
		if (this._editor) { return; } // if editor ALREADY exist.
		if (!this._control) { return; } // if control DOESNT exist.

		const el = this.editorBox.nativeElement;

		// Load CKEditor
		ClassicEditor.create(el).then(editor => { // ,this._settings

			this._editor = editor;
			this.renderer.setAttribute(el.parentElement.querySelector('.ck-content'), 'id', 'content');

			// Disabled / ReadOnly flags
			this._editor.isReadOnly = this._control.disabled;
			this._control.registerOnDisabledChange((disabled) => {
				this._editor.isReadOnly = disabled;
			});

			this._editor.setData(this._control.value);
			this._control.valueChanges.subscribe((value: string) => {
				if (this._updateFromEditor) { return; }

				// Set editor value
				this._updateFromForm = true;
				this._editor.setData(value);
				this._updateFromForm = false;
			});

			// Create editor event listener
			this._editor.listenTo(this._editor.model.document, 'change', () => {
				if (this._updateFromForm) { return; }

				// Set control value
				this._updateFromEditor = true;
				this._control.setValue(this._editor.getData());
				this._updateFromEditor = false;

				// Mark as dirty
				if (!this._control.dirty) { this._control.markAsDirty(); }
			});
		}).catch(err => {
			console.error(err);
		});
	}

	ngOnDestroy() {
		// User might navigate away before the editor gets to load.
		if (this._editor) { this._editor.destroy(); }
	}
}
