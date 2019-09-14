import { Express, Request, Response, NextFunction, json, urlencoded } from 'express';
import { util as configUtil, get as configGet } from 'config';

import * as helmet from 'helmet';
import * as logger from 'morgan';
import * as methodOverride from 'method-override';
import * as cookieParser from 'cookie-parser';
import * as fileUpload from 'express-fileupload';

export class Setup {
	/**
	 * Initiates setup
	 */
	public static initiate(app: Express) {
		// Secure app with helmet
		app.use(helmet());

		// Read cookies
		app.use(cookieParser());

		// set port
		app.set('port', process.env.PORT || configGet<number>('port') || 2000);

		// bodyParser
		app.use(urlencoded({ extended: false }));
		app.use(json({ type: 'application/json' }));

		// express-fileupload
		app.use(fileUpload({ limits: { fileSize: 15 * 1024 * 1024 }, })); // 15 MB

		// Logging
		if (configUtil.getEnv('NODE_ENV') !== 'test') {
			app.use(logger(configGet<string>('loggingMode'))); // logger
		}

		// Headers (CORS)
		const allowedOrigins = configGet<string[]>('allowedOrigins');
		app.use((req: Request, res: Response, next: NextFunction) => {
			const origin = req.headers.origin;
			if (typeof origin === 'string' && allowedOrigins.includes(origin)) {
				res.setHeader('Access-Control-Allow-Origin', origin);
			}
			res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
			res.header('Access-Control-Allow-Headers',
				'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
			res.header('Access-Control-Allow-Credentials', 'true');
			next();
		});

		// Method override
		app.use(methodOverride());
	}
}
