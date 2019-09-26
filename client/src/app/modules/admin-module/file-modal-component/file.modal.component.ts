import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@app/modules/material.types';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

import { FilesService } from '@app/services';
import { FileData, FileThumbnail } from '@types';

import { of } from 'rxjs';
import { take, catchError } from 'rxjs/operators';


@Component({
	selector: 'file-modal',
	styleUrls: ['./file.modal.component.scss'],
	templateUrl: './file.modal.component.html',
	changeDetection: ChangeDetectionStrategy.Default
})
export class FileModalComponent {
	public patchFileForm: FormGroup;


	constructor(
		public dialogRef: MatDialogRef<FileModalComponent>,
		private fileService: FilesService,
		private fb: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public data: FileThumbnail) {

		this.patchFileForm = this.fb.group({
			title: [data.title, Validators.required]
		});
	}

	/**
	 * Proceeds with the task and closes the modal.
	 */
	public submitForm(): void {
		this.patchFileForm.disable();

		const file: FileData = this.patchFileForm.value;

		this.fileService.updateFile(this.data.uuid, file).pipe(
			take(1),
			catchError(() => of(null))
		).subscribe(result => {
			if (!!result) {
				this.dialogRef.close(true);
				return;
			}
			this.patchFileForm.enable();
		});
	}

	/**
	 * Closes the modal without proceeding.
	 */
	public close(): void {
		this.dialogRef.close(false);
	}
}
