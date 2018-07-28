import { Component, ChangeDetectionStrategy } from '@angular/core';
import { StorageService } from '@app/services';


@Component({
	selector: 'admin-component',
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent {

	public get tabIndex() { return this.storage.getSession('adminTabIndex'); }
	public set tabIndex(value: string) { this.storage.setSession('adminTabIndex', value); }

	constructor(private storage: StorageService) {}


}
