import { Express, Router } from 'express';
import {
	AdminController, AuthController, CMSController, UsersController,
	FilesController, ErrorController, ToolsController, SettingsController,
	ThemeController
} from './controllers';

export class AppRouter {

	/**
	 * Initiates a route
	 */
	public static initiate(app: Express) {
		const apiRoutes = Router();

		const controllers = [
			new AdminController(), new AuthController(), new CMSController(),
			new FilesController(), new ErrorController(), new SettingsController(),
			new ThemeController(), new ToolsController(), new UsersController()
		];
		controllers.sort( (a, b) => b.Priority - a.Priority).forEach(controller => {
			apiRoutes.use(controller.RouteDomain, controller.Router);
		});

		// Assign routers to Express app
		app.use('/api', apiRoutes);
	}
}
