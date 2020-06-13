import { Component, ChangeDetectionStrategy, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { DestroyableClass } from '@app/classes';
import { FilesService } from '@app/services/controllers/files.service';

import { FileThumbnail } from '@types';

import { BehaviorSubject } from 'rxjs';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';



@Component({
	selector: 'filesuploaded-component',
	templateUrl: './filesuploaded.component.html',
	styleUrls: ['./filesuploaded.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilesUploadedComponent extends DestroyableClass {
	@ViewChild(CdkVirtualScrollViewport, { static: true }) viewPort: CdkVirtualScrollViewport;

	private readonly _subjectAll = new BehaviorSubject<FileThumbnail[]>([]);
	private readonly _subject = new BehaviorSubject<FileThumbnail[]>([]);

	public readonly DateFormat = 'dd. MMM yyyy, HH:mm';


	public get Thumbnails() {
		return this._subject.asObservable();
	}
	public readonly filterForm: FormGroup;


	constructor(
		private ref: MatDialogRef<FilesUploadedComponent>,
		private fileService: FilesService,
		private fb: FormBuilder,
		private datePipe: DatePipe,
		@Inject(MAT_DIALOG_DATA) public data: any) {
		super();

		this.fileService.getThumbnails().pipe(takeUntil(this.OnDestroy)).subscribe(
			files => {
				this._subjectAll.next(files);
				this._subject.next(files);
			}
		);

		// Filter form
		this.filterForm = this.fb.group({ filterControl: [''] });
		this.filterForm.get('filterControl').valueChanges.pipe(
			distinctUntilChanged(), debounceTime(300), takeUntil(this.OnDestroy)
		).subscribe( (value: string) => {
			this.filterList(value.toLowerCase().trim());
		});
	}


	private filterList(filterString: string) {
		const newList = this._subjectAll.getValue().filter( file => {

			return file.title.toLowerCase().includes(filterString)
				|| file.uploadedBy.username.toLowerCase().includes(filterString)
				|| this.datePipe.transform(file.uploadedDate, this.DateFormat).toLowerCase().includes(filterString);
		});
		this._subject.next(newList);
		this.viewPort.scrollToIndex(0);
	}


	public clickImage(uuid: string) {
		this.fileService.getFileURLs(uuid).pipe(takeUntil(this.OnDestroy)).subscribe(urlObject => {
			this.ref.close(urlObject);
		});
	}

	public close() {
		this.ref.close();
		console.log('close');
	}
}
