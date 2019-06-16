import { env } from '@env';

import { AuthService } from '@app/services';
import { first, timeout, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export const handleForUser = (service: AuthService, handler: () => boolean) => {
	if (service.hasToken) {
		return service.user.pipe(
			first(user => user != null),
			timeout(env.TIMEOUT),
			map(() => handler()),
			catchError(() => of(handler()))
		);
	}
	return handler();
};
