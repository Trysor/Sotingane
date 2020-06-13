import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';


export abstract class DestroyableClass implements OnDestroy {
	private _ngUnsub = new Subject();

	protected get OnDestroy() {
		return this._ngUnsub.asObservable();
	}


	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}
}
