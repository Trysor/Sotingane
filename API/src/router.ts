import { Express, Router } from 'express';
import { AdminController, AuthController, CMSController, UsersController, ErrorController } from './controllers';


export class AppRouter {

	/**
	 * Initiates a route
	 * @param  {Express} app expressModule
	 */
	public static initiate(app: Express) {
		// API routes
		const apiRoutes = Router();
		apiRoutes.use('/cms', new CMSController().router);
		apiRoutes.use('/admin', new AdminController().router);
		apiRoutes.use('/admin', new UsersController().router);
		apiRoutes.use('/auth', new AuthController().router);
		// Set a common fallback for /api/*; 404 for invalid route
		apiRoutes.all('*', ErrorController.error);


		// Assign routers to Express app
		app.use('/api', apiRoutes);
	}
}
