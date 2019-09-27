import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ImageModalData } from '@types';

@Component({
	selector: 'image-modal',
	styleUrls: ['./imagemodal.component.scss'],
	template: `
		<div class="panel index"><span>{{ index + 1 }} / {{ data.images.length }}</span></div>
		<div class="panel prev">
			<button mat-icon-button disableRipple="true" [disabled]="prevDisabled" (click)="prev()">
				<mat-icon>navigate_before</mat-icon>
			</button>
		</div>
		<div class="load" *ngIf="loading">
			<mat-progress-spinner mode="indeterminate" diameter="100" color="accent"></mat-progress-spinner>
		</div>
		<img [src]="imageData.url" (click)="close()" (load)="loaded()"> <!-- [alt]="data.alt" -->
		<div class="panel next">
			<button mat-icon-button disableRipple="true" [disabled]="nextDisabled" (click)="next()">
				<mat-icon>navigate_next</mat-icon>
			</button>
		</div>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageModalComponent {
	private _index: number;
	private _loading = true;


	public get index() { return this._index; }
	public get imageData() { return this.data.images[this._index]; }
	public get loading() { return this._loading; }

	public get nextDisabled() { return this._index === this.data.images.length - 1; }
	public get prevDisabled() { return this._index === 0; }

	constructor(
		public dialogRef: MatDialogRef<ImageModalComponent>,
		@Inject(MAT_DIALOG_DATA) public data: ImageModalData) {

		this._index = data.startIndex;
	}

	/**
	 * Closes the modal without proceeding.
	 */
	public close(): void {
		this.dialogRef.close(false);
	}

	public next() {
		this._loading = true;
		this._index = Math.min(this.data.images.length - 1, this._index + 1);
	}

	public prev() {
		this._loading = true;
		this._index = Math.max(0, this._index - 1);
	}

	public loaded() {
		this._loading = false;
	}
}
