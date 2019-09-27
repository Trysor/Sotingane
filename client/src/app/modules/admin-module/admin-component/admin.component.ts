import { Component, ChangeDetectionStrategy } from '@angular/core';
import { StorageService, StorageKey } from '@app/services/utility/storage.service';


@Component({
	selector: 'admin-component',
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent {

	public get tabIndex() { return this.storage.getSession(StorageKey.AdminTabIndex); }
	public set tabIndex(value: string) { this.storage.setSession(StorageKey.AdminTabIndex, value); }

	constructor(private storage: StorageService) {}


}
