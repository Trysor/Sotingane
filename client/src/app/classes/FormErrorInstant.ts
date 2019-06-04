import { ErrorStateMatcher } from '@app/modules/material.types';
import { NgForm, FormGroupDirective, FormControl } from '@angular/forms';

export class FormErrorInstant implements ErrorStateMatcher {
	isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
		return !!(control && control.errors && (control.touched || control.value.length > 0));
	}
}
