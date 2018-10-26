import { Component, OnInit, Input, ElementRef, ChangeDetectionStrategy } from '@angular/core';

import { DynamicComponent } from '@types';

import { PlatformService } from '@app/services/utility/platform.service';
import { DynamicLazyLoader } from './dynamic.lazy.loader';


@Component({
	selector: 'router-link',
	template: `
		<ng-container [ngSwitch]="isRemoteUrl">
			<a *ngSwitchCase="true" [href]="link">{{text}}</a>
			<a *ngSwitchCase="false" [routerLink]="link">{{text}}</a>
		</ng-container>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicLinkComponent extends DynamicLazyLoader implements DynamicComponent, OnInit {
	@Input() link: string;
	@Input() text: string;

	public get isRemoteUrl(): boolean { return this._isRemoteUrl; }

	private _isRemoteUrl = true;

	constructor(
		private platform: PlatformService,
		private elRef: ElementRef<HTMLElement>) {

		super(elRef, null);
	}

	ngOnInit() {
		// Protect against template issues
		if (!this.elRef.nativeElement.parentNode) { return; }

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

	load() { }
}
