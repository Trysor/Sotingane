import { Express, Router } from 'express';
import {
	AdminController, AuthController, CMSController, UsersController,
	FilesController, ErrorController, SettingsController, ThemeController
} from './controllers';

export class AppRouter {

	/**
	 * Initiates a route
	 */
	public static initiate(app: Express) {
		// API routes
		const apiRoutes = Router();
		apiRoutes.use('/cms', new CMSController().router);
		apiRoutes.use('/files', new FilesController().router);
		apiRoutes.use('/admin', new AdminController().router);
		apiRoutes.use('/admin', new UsersController().router);
		apiRoutes.use('/auth', new AuthController().router);
		apiRoutes.use('/settings', new SettingsController().router);
		apiRoutes.use('/theme', new ThemeController().router);
		// Set a common fallback for /api/*; 404 for invalid route
		apiRoutes.all('*', ErrorController.error);


		// Assign routers to Express app
		app.use('/api', apiRoutes);
	}
}
