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
	public Router: Router;
	public RouteDomain: string;
	public Priority: number;
}


/**
 * Class Decorator: Assigns a route domain to the controller
 * @param routeDomain the domain to which this controller creates routing-handles
 * @param priority the priority of any handles created. Higher means more important (loads before less important)
 */
export function RouteDomain(routeDomain: string, priority: number = 0) {
	return <T extends new (...args: any[]) => {}>(ctor: T) => {
		ctor.prototype.RouteDomain = routeDomain;
		ctor.prototype.Priority = priority;
		return ctor;
	};
}


/*
 |--------------------------------------------------------------------------
 | isProduction
 |--------------------------------------------------------------------------
*/

const env = configUtil.getEnv('NODE_ENV');
export const isProduction = env === 'production';


/*
 |--------------------------------------------------------------------------
 | Decorator helpers
 |--------------------------------------------------------------------------
*/

const getRouter = (target: Controller): Router => {
	if (!target.Router) { target.Router = Router(); }
	return target.Router;
};
enum RouterMatcher { GET, POST, PATCH, DELETE, ALL }
const _routerMatcherDecoratorFunc = (opts: RoutingOptions, matcher: RouterMatcher) => {
	return (target: Controller, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
		if (opts.ignore) { return; }
		opts.do.push(descriptor.value);

		switch (matcher) {
			case RouterMatcher.GET:
				getRouter(target).get(opts.path, opts.do);
				return;
			case RouterMatcher.POST:
				getRouter(target).post(opts.path, opts.do);
				return;
			case RouterMatcher.PATCH:
				getRouter(target).patch(opts.path, opts.do);
				return;
			case RouterMatcher.DELETE:
				getRouter(target).delete(opts.path, opts.do);
				return;
			case RouterMatcher.ALL:
				getRouter(target).all(opts.path, opts.do);
				return;
		}
	};
};


/*
 |--------------------------------------------------------------------------
 | Routing decorators
 |--------------------------------------------------------------------------
*/


/**
 * Method Decorator: Assigns the method to a GET request handler
 */
export function GET(opts: RoutingOptions) {
	return _routerMatcherDecoratorFunc(opts, RouterMatcher.GET);
}

/**
 * Method Decorator: Assigns the method to a POST request handler
 */
export function POST(opts: RoutingOptions) {
	return _routerMatcherDecoratorFunc(opts, RouterMatcher.POST);
}

/**
 * Method Decorator: Assigns the method to a PATCH request handler
 */
export function PATCH(opts: RoutingOptions) {
	return _routerMatcherDecoratorFunc(opts, RouterMatcher.PATCH);
}

/**
 * Method Decorator: Assigns the method to a DELETE request handler
 */
export function DELETE(opts: RoutingOptions) {
	return _routerMatcherDecoratorFunc(opts, RouterMatcher.DELETE);
}

/**
 * Method Decorator: Assigns the method to all request handlers
 */
export function ALL(opts: RoutingOptions) {
	return _routerMatcherDecoratorFunc(opts, RouterMatcher.ALL);
}
