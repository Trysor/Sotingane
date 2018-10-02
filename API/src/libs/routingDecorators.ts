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
	handlers: RequestHandler[];
}
const getRouter = (target: any): Router => {
	if (!target._router) { target._router = Router(); }
	return target._router;
};

/*
 |--------------------------------------------------------------------------
 | isProduction
 |--------------------------------------------------------------------------
*/

export const isProduction = configUtil.getEnv('NODE_ENV') === 'production';

/*
 |--------------------------------------------------------------------------
 | Decorators
 |--------------------------------------------------------------------------
*/

/**
 * Assigns the method to a GET request handler
 * @param opts
 */
export function GET(opts: RoutingOptions) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		if (opts.ignore) { return; }
		opts.handlers.push(descriptor.value);
		getRouter(target).get(opts.path, opts.handlers);
	};
}

/**
 * Assigns the method to a POST request handler
 * @param opts
 */
export function POST(opts: RoutingOptions) {
	return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
		if (opts.ignore) { return; }
		opts.handlers.push(descriptor.value);
		getRouter(target).post(opts.path, opts.handlers);
	};
}

/**
 * Assigns the method to a PATCH request handler
 * @param opts
 */
export function PATCH(opts: RoutingOptions) {
	return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
		if (opts.ignore) { return; }
		opts.handlers.push(descriptor.value);
		getRouter(target).patch(opts.path, opts.handlers);
	};
}

/**
 * Assigns the method to a DELETE request handler
 * @param opts
 */
export function DELETE(opts: RoutingOptions) {
	return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
		if (opts.ignore) { return; }
		opts.handlers.push(descriptor.value);
		getRouter(target).delete(opts.path, opts.handlers);
	};
}
