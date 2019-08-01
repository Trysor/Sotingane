import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { AuthService } from '@app/services';

@Component({
	selector: 'header-component',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
	@Output() leftNav: EventEmitter<void> = new EventEmitter();
	@Output() rightNav: EventEmitter<void> = new EventEmitter();

	constructor(public authService: AuthService) {	}


	/**
	 * Toggles the left sidepanel in mobile view
	 */
	public toggleLeft(): void {
		this.leftNav.emit(null);
	}

	/**
	 * Toggles the right sidepanel in mobile view
	 */
	public toggleRight(): void {
		this.rightNav.emit(null);
	}
}
