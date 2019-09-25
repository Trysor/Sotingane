import { Component, ChangeDetectionStrategy } from '@angular/core';

import { DatePipe } from '@angular/common';

import { FilesService } from '@app/services';
import { DestroyableClass } from '@app/classes';

import { FileThumbnail, TableSettings, ColumnType } from '@types';


import { BehaviorSubject, of } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { fi } from 'date-fns/locale';



@Component({
	selector: 'filestore-component',
	templateUrl: './filestore.component.html',
	styleUrls: ['./filestore.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileStoreComponent extends DestroyableClass {
	public data = new BehaviorSubject<FileThumbnail[]>(null);

	public readonly settings: TableSettings<FileThumbnail> = {
		columns: [
			{
				header: ' ',
				noSort: true,
				type: ColumnType.Image,
				property: 'thumbnail',
				narrow: true
			},
			{
				header: 'Title',
				property: 'title',
			},
			{
				header: 'Uploaded date',
				property: 'uploadedDate',
				val: file => this.datePipe.transform(file.uploadedDate)
			},
			{
				header: 'Uploaded by',
				property: 'uploadedBy',
				val: file => file.uploadedBy.username
			},
			{
				header: '',
				property: 'edit',
				noSort: true,
				type: ColumnType.Button,
				icon: { val: () => 'edit' },
				ariaLabel: file => `Edit file: ${file.title}`,
				tooltip: file => `Edit file: ${file.title}`,
				removeText: true,
				func: (file, files) => {
					console.log('EDIT:', file);
				},
				narrow: true
			},
			{
				header: '',
				property: 'delete',
				noSort: true,
				type: ColumnType.Button,
				icon: { val: () => 'delete' },
				ariaLabel: file => `Delete file: ${file.title}`,
				tooltip: file => `Delete file: ${file.title}`,
				removeText: true,
				func: (file, files) => {
					this.fileService.deleteFile(file.uuid).pipe<boolean>(
						catchError(() => of(false))
					).subscribe(success => {
						if (!success) { return; }

						this.data.next([]);
						console.log(file);
						console.log(files.length);
						files.splice(files.indexOf(file), 1);
						console.log(files.length);
						this.data.next(files);
					});
				},
				narrow: true
			},
		],

		active: 'uploadedDate',
		dir: 'desc',

		trackBy: (index, file) => file.uuid,

		mobile: ['title', 'uploadedDate', 'uuid'], // uuid = delete

	};


	constructor(
		private datePipe: DatePipe,
		public fileService: FilesService) {

		super();
		this.updateList();
	}


	/**
	 * Updates the user list
	 */
	private updateList() {
		this.fileService.getThumbnails().pipe(takeUntil(this.OnDestroy)).subscribe(files => {
			this.data.next(files);
		});
	}

}
