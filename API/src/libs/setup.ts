import { Express, Request, Response, NextFunction } from 'express';
import { util as configUtil, get as configGet } from 'config';

import * as helmet from 'helmet';
import { json, urlencoded } from 'body-parser';
import * as logger from 'morgan';
import * as methodOverride from 'method-override';

export class Setup {
	/**
	 * Initiates setup
	 * @param  {Express} app express
	 */
	public static initiate(app: Express) {
		// Secure app with helmet
		app.use(helmet());

		// set port
		app.set('port', process.env.PORT || configGet<number>('port') || 2000);

		// bodyParser
		app.use(urlencoded({ extended: false }));
		app.use(json());

		// Logging
		if (configUtil.getEnv('NODE_ENV') !== 'test') {
			// use morgan to log at command line
			app.use(logger(configGet<string>('loggingMode')));
		}

		// Headers (CORS)
		app.use((req: Request, res: Response, next: NextFunction) => {
			const origin = req.headers.origin;
			if (typeof origin === 'string' && configGet<string[]>('allowedOrigins').indexOf(origin) > -1) {
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
