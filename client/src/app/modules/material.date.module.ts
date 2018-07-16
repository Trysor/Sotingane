import { NgModule } from '@angular/core';

import { MAT_DATE_LOCALE, DateAdapter, MatNativeDateModule } from '@angular/material';

import { DateAdapterService } from '@app/services';


const MY_DATE_FORMATS = {
	parse: {
		dateInput: { month: 'numeric', year: 'numeric', day: 'numeric' }
	},
	display: {
		dateInput: 'input',
		monthYearLabel: { year: 'numeric', month: 'short' },
		dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
		monthYearA11yLabel: { year: 'numeric', month: 'long' },
	}
};


@NgModule({
	exports: [
		MatNativeDateModule
	],
	providers: [
		{ provide: DateAdapter, useClass: DateAdapterService },
		{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
	],
})
export class MaterialDateModule { }
