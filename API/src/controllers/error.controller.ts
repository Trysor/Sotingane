import { Request, Response, NextFunction } from 'express';
import { status, ROUTE_STATUS } from '../libs/validate';
import { Controller, RouteDomain, ALL } from '../libs/routing';

@RouteDomain('*', -10)
export class ErrorController extends Controller {

	/**
	 * Returns 404 with a route invalid message
	 */
	@ALL({ path: '*', do: [] })
	public error(req: Request, res: Response, next: NextFunction) {
		return res.status(404).send(status(ROUTE_STATUS.INVALID));
	}
}
