import { Directive, Renderer2, ElementRef, AfterViewInit, Input } from '@angular/core';

import { DestroyableClass } from '@app/classes';
import { FileDropSettings } from '@types';

@Directive({
	selector: '[appFileDrop]'
})
export class FileDropDirective extends DestroyableClass implements AfterViewInit {
	@Input('appFileDrop') public fileDropSettings: FileDropSettings;

	private _enterCounter = 0;


	constructor(private el: ElementRef, private renderer: Renderer2) {
		super();
	}


	ngAfterViewInit() {
		if (!this.fileDropSettings) { return; }

		const elem = this.el.nativeElement;
		const eventHandlers = [
			this.renderer.listen(elem, 'dragenter', this.dragEnter.bind(this)),
			this.renderer.listen(elem, 'dragleave', this.dragLeave.bind(this)),
			this.renderer.listen(elem, 'dragover', this.dragOver.bind(this)),
			this.renderer.listen(elem, 'drop', this.drop.bind(this))
		];

		this.OnDestroy.subscribe(() => {
			eventHandlers.forEach(unregister => unregister());
		});
	}

	private dragEnter(event: DragEvent) {
		this.stopDefault(event);
		this._enterCounter++;

		if (event.dataTransfer.types.includes('Files')) {
			this.renderer.addClass(this.el.nativeElement, 'filedrop');
		}
	}

	private dragLeave(event: DragEvent) {
		this.stopDefault(event);
		this._enterCounter--;

		if (this._enterCounter === 0) {
			this.renderer.removeClass(this.el.nativeElement, 'filedrop');
		}
	}

	private dragOver(event: DragEvent) {
		this.stopDefault(event);
	}

	private drop(event: DragEvent) {
		this.stopDefault(event);
		this._enterCounter = 0;
		this.renderer.removeClass(this.el.nativeElement, 'filedrop');

		const allowedFiles = this.allowedFiles(event);
		if (allowedFiles.length > 0) {
			this.fileDropSettings.fileHandler(allowedFiles);
		}
	}

	private stopDefault(event: Event) {
		event.stopPropagation();
		event.preventDefault();
	}


	private allowedFiles(event: DragEvent) {
		if (!event.dataTransfer.types.includes('Files')) {
			return [];
		}

		return Array.from(event.dataTransfer.files).filter(
			file => file.type.match(this.fileDropSettings.accept)
		);
	}
}
