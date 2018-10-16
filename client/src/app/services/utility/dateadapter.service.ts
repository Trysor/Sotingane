import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material';

import { format } from 'date-fns';

@Injectable()
export class DateAdapterService extends NativeDateAdapter {
	format(date: Date, displayFormat: Object): string {
		if (displayFormat === 'input') {
			return format(date, 'yyyy-MM-dd');
		}
		return format(date, 'yyyy-MM-dd');
	}
}
