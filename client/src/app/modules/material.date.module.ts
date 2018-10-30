import { NgModule } from '@angular/core';

import { MAT_DATE_LOCALE, DateAdapter, MatNativeDateModule } from '@angular/material';

import { DateAdapterService } from '@app/services';

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
