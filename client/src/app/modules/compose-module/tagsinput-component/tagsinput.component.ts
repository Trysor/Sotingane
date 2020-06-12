import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { moveItemInArray } from '@angular/cdk/drag-drop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipList } from '@angular/material/chips';
import { map, takeUntil, startWith } from 'rxjs/operators';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { DestroyableClass } from '@app/classes';


@Component({
	selector: 'tagsinput-component',
	templateUrl: './tagsinput.component.html',
	styleUrls: ['./tagsinput.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsInputComponent extends DestroyableClass implements AfterViewInit {
	@ViewChild('input', { static: true }) private inputElem: ElementRef<HTMLInputElement>;
	@Input() form: FormGroup;
	@Input() controlName: string;
	@Input() data: BehaviorSubject<string[]>;

	public readonly tagSeparatorKeyCodes: number[] = [ENTER, COMMA];
	public readonly tagTextInputControl = new FormControl();

	public AutoCompleteList: Observable<string[]>;
	public currentTags: Observable<string[]>;

	constructor() { super(); }

	ngAfterViewInit(): void {
		this.currentTags = this.form.get(this.controlName).valueChanges.pipe(startWith([]));

		this.AutoCompleteList = combineLatest([
			this.tagTextInputControl.valueChanges as Observable<string>,
			this.data
		]).pipe(
			takeUntil(this.OnDestroy),
			map(combinedLatest => {
				const [typedText, data] = combinedLatest;

				return data.filter(tag =>
					tag.toLowerCase().startsWith(typedText.toLowerCase())						// Startswith filter
					&& !(this.form.get(this.controlName).value as string[]).includes(tag)		// not already part of our list
				);
			})
		);
	}

	// ---------------------------------------
	// --------------- METHODS ---------------
	// ---------------------------------------

	public addTag(event: MatAutocompleteSelectedEvent | MatChipInputEvent) {
		const newTag = (event instanceof MatAutocompleteSelectedEvent) ? event.option.viewValue : event?.value?.trim();

		const tags = this.form.get(this.controlName).value as string[];
		if (!newTag || tags.includes(newTag)) { return; }
		this.inputElem.nativeElement.value = '';
		this.tagTextInputControl.setValue('');
		tags.push(newTag);
		this.form.get(this.controlName).setValue(tags);
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
