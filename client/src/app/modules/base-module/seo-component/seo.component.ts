import { Component, HostBinding, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'seo-component',
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SEOComponent implements OnChanges {
	@Input() json: object;
	@HostBinding('innerHTML') script: SafeHtml;

	constructor( private san: DomSanitizer) { }

	ngOnChanges(changes: SimpleChanges) {
		this.script = this.toScript(changes.json.currentValue);
	}

	/**
	 * Creates the trusted script element to inject
	 */
	private toScript(json: object): SafeHtml {
		return this.san.bypassSecurityTrustHtml(`<script type="application/ld+json">${JSON.stringify(json)}</script>`);
	}
}
