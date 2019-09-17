import { Component, ChangeDetectionStrategy, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ReplaySubject, BehaviorSubject, of } from 'rxjs';
import { CustomUploadAdapterOptions } from '@types';
import { FilesService } from '@app/services';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

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

	constructor(private filesService: FilesService) {
		// Configure upload. has to be done before the editor initializes
		ClassicEditor.defaultConfig.customUpload = this.createCustomUploadSettings();
	}

	// ---------------------------------------
	// ------------- PROPERTIES --------------
	// ---------------------------------------

	public get WordCount() { return this._wordCountSubject.asObservable(); }
	public get CharacterCount() { return this._charCountSubject.asObservable(); }

	@Output() public get Editor() { return this._editorSubject.asObservable(); }


	// ---------------------------------------
	// --------------- METHODS ---------------
	// ---------------------------------------

	public editorReady(editor: any) {
		this._editorSubject.next(editor);
		this._editorSubject.complete();

		// Configure word count
		editor.plugins.get('WordCount').on('update', (evt: any, data: any) => {
			this._wordCountSubject.next(data.words);
			this._charCountSubject.next(data.characters);
		});
	}


	private createCustomUploadSettings() {
		return {
			fileUploader: (file, updateProgressCallback) => {
				const obs = this.filesService.uploadImage(file);

				let cancelFunc: () => void;
				const promise = new Promise<File>((resolve, reject) => {
					const sub = obs.pipe(catchError((e: HttpErrorResponse) => of(e))).subscribe(event => {
						// Error
						if (event instanceof HttpErrorResponse) {
							reject(event.error);
							return;
						}

						// Upload progress
						if (event.type === HttpEventType.UploadProgress) {
							updateProgressCallback(event.total, event.loaded);
							return;
						}

						// Response (everything received or request somehow completed)
						if (event.type === HttpEventType.Response) {
							if (event.ok) {
								resolve(event.body);
								return;
							}
							reject(event.body);
						}
					});
					cancelFunc = () => {
						sub.unsubscribe();
						reject('Cancelled');
					};
				});

				return {
					promise,
					cancelFunc
				};
			}
		} as CustomUploadAdapterOptions;
	}
}
