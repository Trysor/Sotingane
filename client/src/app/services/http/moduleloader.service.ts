import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModuleLoaderService {

	public async loadCodeHighlightModule() {
		const m = await import('@app/modules/codehighlight.module');
		return m.CodeHighlightModule;
	}
}
