import { Express, Router } from 'express';
import { util as configUtil } from 'config';

// Passport
import { authenticate } from 'passport';
import { PassportConfig } from './libs/passportConfig';

import { accessRoles } from './models/user';

// Validation
import { JSchema, validateSchema, VALIDATION_FAILED } from './libs/validate';

// Controllers
import { AdminController } from './controllers/admin';
import { AuthController } from './controllers/auth';
import { CMSController } from './controllers/cms';
import { UsersController } from './controllers/users';
import { ErrorController } from './controllers/error';


// Require login/auth


export class AppRouter {

	/**
	 * Initiates a route
	 * @param  {Express} app expressModule
	 */
	public static initiate(app: Express) {
		// Set up PassportConfig first
		PassportConfig.initiate();

		// API routes
		const apiRoutes = Router();
		this.authRoutes(apiRoutes);
		this.cmsRoutes(apiRoutes);
		this.adminRoutes(apiRoutes);
		// Set a common fallback for /api/*; 404 for invalid route
		apiRoutes.all('*', ErrorController.error);


		// Assign routers to Express app
		app.use('/api', apiRoutes);
	}



	/**
	 * Init Auth routes
	 * @param  {Router} router the parent router
	 */
	private static authRoutes(router: Router) {
		const authRoutes = Router();

		// Register a user
		if (configUtil.getEnv('NODE_ENV') !== 'production') {
			authRoutes.post('/register',
				validateSchema(JSchema.UserRegistrationSchema, VALIDATION_FAILED.USER_MODEL),
				AuthController.register);
		}

		// Login a user
		authRoutes.post('/login',
			validateSchema(JSchema.UserLoginSchema, VALIDATION_FAILED.USER_MODEL),
			PassportConfig.requireLogin, AuthController.token); // requireLogin here. Intended.

		// Request a new token
		authRoutes.get('/token', PassportConfig.requireAuth, AuthController.token); // requireAuth here. Intended.

		// Logout a user
		authRoutes.post('/logout', PassportConfig.requireAuth, AuthController.logout);

		// Request to update password
		authRoutes.post('/updatepassword',
			PassportConfig.requireAuth,
			validateSchema(JSchema.UserUpdatePasswordSchema, VALIDATION_FAILED.USER_MODEL),
			AuthController.updatePassword);

		// assign to parent router
		router.use('/auth', authRoutes);
	}



	/**
	 * Init CMS routes
	 * @param  {Router} router the parent router
	 */
	private static cmsRoutes(router: Router) {
		const cmsRoutes = Router();

		// Get content list
		cmsRoutes.get('/', PassportConfig.configureForUser, CMSController.getContentList);

		// Create content
		cmsRoutes.post('/', PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			validateSchema(JSchema.ContentSchema, VALIDATION_FAILED.CONTENT_MODEL),
			CMSController.createContent);

		// Search content
		cmsRoutes.get('/search/:searchTerm', PassportConfig.configureForUser, CMSController.searchContent);

		// Get content
		cmsRoutes.get('/:route', PassportConfig.configureForUser, CMSController.getContent);

		// Patch content
		cmsRoutes.patch('/:route', PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			validateSchema(JSchema.ContentSchema, VALIDATION_FAILED.CONTENT_MODEL),
			CMSController.patchContent);

		// Delete content
		cmsRoutes.delete('/:route',
			PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			CMSController.deleteContent);

		// Content History
		cmsRoutes.get('/history/:route',
			PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			CMSController.getContentHistory);

		// assign to parent router
		router.use('/cms', cmsRoutes);
	}

	/**
	 *
	 * @param router
	 */
	private static adminRoutes(router: Router) {
		const adminRoutes = Router();

		// Users Routes
		const usersRoutes = Router();

		// Get user list
		usersRoutes.get('/',
			PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			UsersController.getAllUsers);

		// Patch User
		usersRoutes.patch('/:id',
			PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			validateSchema(JSchema.UserAdminUpdateUser, VALIDATION_FAILED.USER_MODEL),
			UsersController.patchUser);

		// -------------------------------

		// Content routes
		const contentRoutes = Router();

		// Get full content list
		contentRoutes.get('/',
			PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			AdminController.getAdminContentList);

		contentRoutes.get('/:route',
			PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			AdminController.getContentFull);

		contentRoutes.post('/aggregate',
			PassportConfig.requireAuth,
			AuthController.requireRole(accessRoles.admin),
			validateSchema(JSchema.AdminAggregationSchema, VALIDATION_FAILED.ADMIN_MODEL),
			AdminController.aggregateContent
		);

		// -------------------------------

		// admin route
		adminRoutes.use('/users', usersRoutes);
		adminRoutes.use('/cms', contentRoutes);
		router.use('/admin', adminRoutes);
	}

}
