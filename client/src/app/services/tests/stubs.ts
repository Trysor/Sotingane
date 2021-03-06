﻿
import { User } from '@types';

import { AuthService } from '@app/services/controllers/auth.service';
import { MobileService } from '@app/services/utility/mobile.service';

import { BehaviorSubject, of, Subject } from 'rxjs';



// ---------------------------------------
// ------------ AUTH SERVICE -------------
// ---------------------------------------

export const authServiceStub: Partial<AuthService> = {
	user: new BehaviorSubject({ username: null, roles: [], _id: null } as User),
	login: (user: User) => {
		throw Error('Implement in test');
	} // create in test
};
export type AuthServiceStub = typeof authServiceStub;




// ---------------------------------------
// ----------- MOBILE SERVICE ------------
// ---------------------------------------

const isMobile = new BehaviorSubject<boolean>(false);
export const mobileServiceStub: Partial<MobileService> = {
	isMobile: () => isMobile
};
export type MobileServiceStub = typeof mobileServiceStub;

