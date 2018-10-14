import { Component, OnInit, Input, Renderer2, ElementRef, ChangeDetectionStrategy } from '@angular/core';

import { DynamicComponent } from '@app/models';

import { PlatformService } from '@app/services/utility/platform.service';
import { DynamicLazyLoader } from './dynamic.lazy.loader';


@Component({
	selector: 'router-link',
	template: `
		<ng-container [ngSwitch]="isRemoteUrl">
			<a *ngSwitchCase="true" [href]="link" [ngStyle]="style">{{text}}</a>
			<a *ngSwitchCase="false" [routerLink]="link" [ngStyle]="style">{{text}}</a>
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
	public buildJob(el: Element, textContent: string): void {
		this.link = el.getAttribute('href');
		this.text = textContent;
	}

	load() { }
}
