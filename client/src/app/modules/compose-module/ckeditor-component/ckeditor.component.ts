import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ReplaySubject } from 'rxjs';
const ClassicEditor = require('CKEditorClassicBuild');

@Component({
	selector: 'ckeditor-component',
	templateUrl: './ckeditor.component.html',
	styleUrls: ['./ckeditor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CKEDitorComponent {
	public readonly ClassicEditor = ClassicEditor;
	private readonly _editorSubject = new ReplaySubject<any>(1);

	@Input() form: FormGroup;

	public get Editor() { return this._editorSubject.asObservable(); }


	public editorReady(editor: any) {
		this._editorSubject.next(editor);
		this._editorSubject.complete();
	}
}
