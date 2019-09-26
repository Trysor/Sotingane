import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';

import { MatDialog, MatDialogConfig } from '@app/modules/material.types';

import { FilesService, ModalService } from '@app/services';
import { DestroyableClass } from '@app/classes';

import { FileThumbnail, TableSettings, ColumnType, ImageContentData } from '@types';

import { BehaviorSubject, of } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { FileModalComponent } from '../file-modal-component/file.modal.component';



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
					this.dialog.open(
						FileModalComponent,
						{ data: file as FileThumbnail } as MatDialogConfig
					).afterClosed().subscribe((closedResult: boolean) => {
						if (closedResult) { this.updateList(); }
					});
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

						this.updateList();
					});
				},
				narrow: true
			},
		],

		active: 'uploadedDate',
		dir: 'desc',

		rowClick: file => {
			this.fileService.getFileURLs(file.uuid).pipe(takeUntil(this.OnDestroy)).subscribe(payload => {
				this.modalService.openImageModal({
					startIndex: 0,
					images: [{ url: payload.urls.default } as ImageContentData]
				});
			});
		},

		trackBy: (index, file) => file.uuid,

		mobile: ['title', 'uploadedDate', 'uuid'], // uuid = delete

	};


	constructor(
		private dialog: MatDialog,
		private datePipe: DatePipe,
		public modalService: ModalService,
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
