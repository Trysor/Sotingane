import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';

import { ImageModalData } from '@app/models';

@Component({
	selector: 'delete-modal',
	styleUrls: ['./imagemodal.component.scss'],
	template: `<img [src]="data.src" [alt]="data.alt" (click)="close()">`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageModalComponent {
	constructor(
		public dialogRef: MatDialogRef<ImageModalComponent>,
		@Inject(MAT_DIALOG_DATA) public data: ImageModalData) {

	}

	/**
	 * Closes the modal without proceeding.
	 */
	public close(): void {
		this.dialogRef.close(false);
	}
}
