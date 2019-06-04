import { Injectable } from '@angular/core';
import { MatSnackBar } from '@app/modules/material.types';

@Injectable({ providedIn: 'root' })
export class SnackBarService {
	constructor(private snackBar: MatSnackBar) {}


	/**
	 * Opens a snackbar with the given message and action message
	 * @param  {string} message The message that is to be displayed
	 * @param  {string} action  the action message that is to be displayed
	 */
	public open(message: string, action?: string, duration: number = 5000) {
		return this.snackBar.open(message, action, {
			duration: duration,
		});
	}
}
