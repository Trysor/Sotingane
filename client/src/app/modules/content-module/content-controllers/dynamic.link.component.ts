import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import { DynamicComponent } from '@types';
import { PlatformService } from '@app/services/utility/platform.service';


@Component({
	selector: 'router-link',
	template: `
		<ng-container [ngSwitch]="isRemoteUrl">
			<a *ngSwitchCase="true" [href]="link">{{text}}</a>
			<a *ngSwitchCase="false" [routerLink]="link">{{text}}</a>
		</ng-container>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicLinkComponent implements DynamicComponent, OnInit {
	private _isRemoteUrl = true;

	@Input() link: string;
	@Input() text: string;

	public get isRemoteUrl(): boolean { return this._isRemoteUrl; }


	constructor(private platform: PlatformService) { }

	ngOnInit() {
		if (this.platform.document) {
			const origin = this.platform.document.location.origin;
			if (this.link.startsWith('/') || this.link.startsWith(origin)) {
				this.link = this.link.replace(origin, '');
				this._isRemoteUrl = false;
			}
		}
	}

	/**
	 * DynamicComponent interface method. Triggered as the component is injected
	 * @param el
	 * @param textContent
	 */
	public buildJob(el: Element): void {
		this.link = el.getAttribute('href');
		this.text = el.textContent;
	}
}
