﻿import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@app/modules/material.types';

import { format } from 'date-fns';

@Injectable()
export class DateAdapterService extends NativeDateAdapter {
	format(date: Date, displayFormat: string): string {
		if (displayFormat === 'input') {
			return format(date, 'yyyy-MM-dd');
		}
		return format(date, 'yyyy-MM-dd');
	}
}
