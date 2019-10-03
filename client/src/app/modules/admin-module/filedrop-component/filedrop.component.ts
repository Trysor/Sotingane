import { Component, ChangeDetectionStrategy, Renderer2, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';

import { DestroyableClass } from '@app/classes';

import { FilesService } from '@app/services/controllers/files.service';
import { ModalService } from '@app/services/utility/modal.service';

import { FileUploadResult } from '@types';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';


@Component({
	selector: 'filedrop-component',
	templateUrl: './filedrop.component.html',
	styleUrls: ['./filedrop.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiledropComponent extends DestroyableClass {
	@ViewChild('dropzone', { static: true }) private dropZoneElem: ElementRef<HTMLDivElement>;
	@ViewChild('files', { static: true }) private filesInputElem: ElementRef<HTMLInputElement>;

	@Output() public filesUploaded = new EventEmitter();

	constructor(
		private modalService: ModalService,
		private renderer: Renderer2,
		private filesService: FilesService) {
		super();
	}


	public dragEnter(event: DragEvent) {
		this.stopDefault(event);
		this.renderer.addClass(this.dropZoneElem.nativeElement, 'active');
	}

	public dragLeave(event: DragEvent) {
		this.stopDefault(event);
		this.renderer.removeClass(this.dropZoneElem.nativeElement, 'active');
	}

	public dragOver(event: DragEvent) {
		this.stopDefault(event);
	}

	public drop(event: DragEvent) {
		this.stopDefault(event);
		this.renderer.removeClass(this.dropZoneElem.nativeElement, 'active');

		this.uploadFiles(event.dataTransfer.files);
	}

	public filesChanged() {
		this.uploadFiles(this.filesInputElem.nativeElement.files);
		this.filesInputElem.nativeElement.value = null;
	}

	private async uploadFiles(fileList: FileList) {
		const responses = await Promise.all(
			Array.from(fileList).map(
				file => this.filesService.uploadImage(file).pipe(
					catchError((err: HttpErrorResponse) => of(err))
				).toPromise()
			)
		);

		// const uploaded: FileUploadResult[] = [];
		// for (const res of responses) {
		// 	if (res.type === HttpEventType.Response) {
		// 		uploaded.push(res.body);
		// 	}
		// }

		const successful = responses
			.filter(res => res.type === HttpEventType.Response && res.ok)
			.length;

		this.modalService.openGenericInfoModal(
			'Upload result',
			`Successfully uploaded ${successful} of ${responses.length}.`
		);

		this.filesUploaded.next(true);
	}

	private stopDefault(event: Event) {
		event.stopPropagation();
		event.preventDefault();
	}
}
