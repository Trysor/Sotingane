import { Injectable } from '@angular/core';

import { StorageService, StorageKey } from '@app/services/utility/storage.service';

@Injectable({ providedIn: 'root' })
export class TokenService {

	// Auth Token
	public get token() { return this.storage.getLocal(StorageKey.JWT); }
	public set token(newToken: string) { this.storage.setLocal(StorageKey.JWT, newToken); }

	// Refresh Token
	public get refreshToken() { return this.storage.getLocal(StorageKey.RefreshJWT); }
	public set refreshToken(newToken: string) { this.storage.setLocal(StorageKey.RefreshJWT, newToken); }

	// Constructor
	constructor(private storage: StorageService) { }
}
