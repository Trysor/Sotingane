import { Component, ChangeDetectionStrategy, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ReplaySubject, BehaviorSubject } from 'rxjs';
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
	private readonly _wordCountSubject = new BehaviorSubject<number>(0);
	private readonly _charCountSubject = new BehaviorSubject<number>(0);

	@Input() form: FormGroup;

	public get WordCount() { return this._wordCountSubject.asObservable(); }
	public get CharacterCount() { return this._charCountSubject.asObservable(); }

	public get Editor() { return this._editorSubject.asObservable(); }


	public editorReady(editor: any) {
		this._editorSubject.next(editor);
		this._editorSubject.complete();

		const wordCount = editor.plugins.get('WordCount');
		const container = wordCount.wordCountContainer // TODO: Once the (CKE plugin-) destroy bug is fixed, remove this line

		wordCount.on('update', (evt: any, data: any) => {
			this._wordCountSubject.next(data.words);
			this._charCountSubject.next(data.characters);
		});
	}
}
