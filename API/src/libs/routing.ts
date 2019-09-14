import { Router } from 'express';
import { RequestHandler, PathParams } from 'express-serve-static-core';
import { util as configUtil } from 'config';

/*
 |--------------------------------------------------------------------------
 | Configuration
 |--------------------------------------------------------------------------
*/

interface RoutingOptions {
	path: PathParams;
	ignore?: boolean;
	do: RequestHandler[];
}


/*
 |--------------------------------------------------------------------------
 | Abstract Controller
 |--------------------------------------------------------------------------
*/

export abstract class Controller {
	_router: Router;
	get router() { return this._router; }
}

const getRouter = (target: Controller): Router => {
	if (!target._router) { target._router = Router(); }
	return target._router;
};


/*
 |--------------------------------------------------------------------------
 | isProduction
 |--------------------------------------------------------------------------
*/

const env = configUtil.getEnv('NODE_ENV');
export const isProduction = env === 'production';


/*
 |--------------------------------------------------------------------------
 | CRUD Decorators
 |--------------------------------------------------------------------------
*/

/**
 * Method Decorator: Assigns the method to a GET request handler
 */
export function GET(opts: RoutingOptions) {
	return (target: Controller, propertyKey: string, descriptor: PropertyDescriptor) => {
		if (opts.ignore) { return; }
		opts.do.push(descriptor.value);
		getRouter(target).get(opts.path, opts.do);
	};
}

/**
 * Method Decorator: Assigns the method to a POST request handler
 */
export function POST(opts: RoutingOptions) {
	return (target: Controller, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
		if (opts.ignore) { return; }
		opts.do.push(descriptor.value);
		getRouter(target).post(opts.path, opts.do);
	};
}

/**
 * Method Decorator: Assigns the method to a PATCH request handler
 */
export function PATCH(opts: RoutingOptions) {
	return (target: Controller, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
		if (opts.ignore) { return; }
		opts.do.push(descriptor.value);
		getRouter(target).patch(opts.path, opts.do);
	};
}

/**
 * Method Decorator: Assigns the method to a DELETE request handler
 */
export function DELETE(opts: RoutingOptions) {
	return (target: Controller, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
		if (opts.ignore) { return; }
		opts.do.push(descriptor.value);
		getRouter(target).delete(opts.path, opts.do);
	};
}
