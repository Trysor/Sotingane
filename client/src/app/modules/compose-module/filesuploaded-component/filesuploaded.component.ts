import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DestroyableClass } from '@app/classes';
import { FilesService } from '@app/services';

import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'filesuploaded-component',
	templateUrl: './filesuploaded.component.html',
	styleUrls: ['./filesuploaded.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilesUploadedComponent extends DestroyableClass {
	private _subject = new BehaviorSubject<string[]>([]);
	private _editor = new BehaviorSubject<any>(null);

	public get imageURLs() { return this._subject; }

	@Input() public set Editor(editor: any) { this._editor.next(editor); }
	public get Editor() { return this._editor; }

	constructor(private fileService: FilesService) {
		super();
		this.refreshImages();
	}

	public refreshImages() {
		this.fileService.getThumbnails().pipe(takeUntil(this.OnDestroy)).subscribe(
			files => this._subject.next(files)
		);
	}

	public clickImage(url: string) {
		this._editor.getValue();
		// TODO: Insert magic.
	}
}
