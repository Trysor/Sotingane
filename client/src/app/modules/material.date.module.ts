import { NgModule } from '@angular/core';

import { MAT_DATE_LOCALE, DateAdapter } from '@app/modules/material.types';
import { MatNativeDateModule } from '@angular/material/core';

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
