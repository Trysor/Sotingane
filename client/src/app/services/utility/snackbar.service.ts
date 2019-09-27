import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';


@Injectable({ providedIn: 'root' })
export class SnackBarService {
	constructor(private snackBar: MatSnackBar) {}


	/**
	 * Opens a snackbar with the given message and action message
	 */
	public open(message: string, action?: string, duration: number = 5000) {
		return this.snackBar.open(message, action, { duration });
	}
}
