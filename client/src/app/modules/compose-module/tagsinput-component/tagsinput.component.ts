import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { moveItemInArray } from '@angular/cdk/drag-drop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipInput } from '@angular/material/chips';
import { map, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DestroyableClass } from '@app/classes';


@Component({
	selector: 'tagsinput-component',
	templateUrl: './tagsinput.component.html',
	styleUrls: ['./tagsinput.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsInputComponent extends DestroyableClass {
	@ViewChild('input', { static: true }) private inputElem: ElementRef<HTMLInputElement>;
	@Input() form: FormGroup;
	@Input() controlName: string;
	@Input() data: string[];

	public readonly tagSeparatorKeyCodes: number[] = [ENTER, COMMA];
	public readonly tagTextInputControl = new FormControl();

	public AutoCompleteList: Observable<string[]>;

	constructor() {
		super();
		this.AutoCompleteList = this.tagTextInputControl.valueChanges.pipe(
			takeUntil(this.OnDestroy),
			map((typedText: string) => this.data.filter(tag =>
				tag.toLowerCase().startsWith(typedText.toLowerCase())										// Startswith filter
				&& !(this.form.get(this.controlName).value as string[]).includes(tag)		// not already part of our list
			))
		);
	}

	// ---------------------------------------
	// --------------- METHODS ---------------
	// ---------------------------------------

	public addTag(event: MatChipInputEvent | MatAutocompleteSelectedEvent) {
		const newTag = (event instanceof MatAutocompleteSelectedEvent) ? event.option.viewValue : event?.value?.trim();

		const tags = this.form.get(this.controlName).value as string[];
		if (!newTag || tags.includes(newTag)) { return; }
		this.inputElem.nativeElement.value = '';
		tags.push(newTag);
	}

	public removeTag(tag: string) {
		if (!tag) { return; }

		const tags = this.form.get(this.controlName).value as string[];
		tags.splice(tags.indexOf(tag), 1);
	}

	public sortTag(event: CdkDragDrop<string[]>) {
		moveItemInArray(this.form.get(this.controlName).value, event.previousIndex, event.currentIndex);
	}
}
