import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@app/modules/material.types';

import { ModalData } from '@types';

@Component({
	selector: 'delete-modal',
	styleUrls: ['./modal.component.scss'],
	templateUrl: './modal.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
	constructor(
		public dialogRef: MatDialogRef<ModalComponent>,
		@Inject(MAT_DIALOG_DATA) public data: ModalData) {

	}

	/**
	 * Proceeds with the task and closes the modal.
	 */
	public proceed(): void {
		this.dialogRef.close(true);
	}

	/**
	 * Closes the modal without proceeding.
	 */
	public cancel(): void {
		this.dialogRef.close(false);
	}
}
