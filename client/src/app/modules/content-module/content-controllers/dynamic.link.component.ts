import { Component, OnInit, Input, ChangeDetectionStrategy, HostBinding, HostListener } from '@angular/core';

import { Router } from '@angular/router';

import { DynamicComponent } from '@types';
import { PlatformService } from '@app/services/utility/platform.service';
import { Subject } from 'rxjs';


@Component({
	selector: 'dynamic-link',
	template: `<ng-content></ng-content>`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicLinkComponent implements DynamicComponent, OnInit {
	private _isRemoteUrl = true;
	@Input() @HostBinding('attr.href') link: string;

	@HostListener('click', ['$event']) onclick(e: MouseEvent) {
		if (this._isRemoteUrl) { return; }

		e.stopPropagation();
		e.preventDefault();
		this.router.navigateByUrl(this.link);
	}

	public get isRemoteUrl(): boolean { return this._isRemoteUrl; }


	constructor(private router: Router, private platform: PlatformService) {}

	ngOnInit() {
		if (!this.link || this.link.length === 0) { return; }

		if (this.platform.document) {
			this.link = this.link.replace(this.platform.document.location.origin, '');
		}

		this._isRemoteUrl = !this.link.startsWith('/');
	}

	/**
	 * DynamicComponent interface method. Triggered as the component is injected
	 */
	public buildJob(el: Element): void {
		this.link = el.getAttribute('href');
	}
}
