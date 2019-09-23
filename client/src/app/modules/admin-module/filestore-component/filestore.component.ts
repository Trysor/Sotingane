import { Component, ChangeDetectionStrategy } from '@angular/core';

import { DatePipe } from '@angular/common';

import { FilesService } from '@app/services';
import { DestroyableClass } from '@app/classes';

import { FileThumbnail, TableSettings, ColumnType } from '@types';


import { BehaviorSubject, of } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';



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
				header: 'Title',
				property: 'title',
			},
			{
				header: 'Uploaded date',
				property: 'uploadedDate',
				val: (file: FileThumbnail): string => {
					return this.datePipe.transform(file.uploadedDate);
				}
			},
			{
				header: '',
				property: 'uuid',
				noSort: true,
				type: ColumnType.Button,
				icon: { val: () => 'delete' },
				ariaLabel: file => `Delete file: ${file.title}`,
				removeText: true,
				func: (file, files) => {
					this.fileService.deleteFile(file.uuid).pipe<boolean>(
						catchError(() => of(false))
					).subscribe( success => {
						if (success) {
							const index = files.indexOf(file);
							files.splice(index, 1);
						}
					});
				},
				narrow: true
			}
		],

		active: 'title',
		dir: 'asc',

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
