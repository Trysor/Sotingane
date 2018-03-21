import * as express from 'express';
import { get as configGet, util as configUtil } from 'config';
// import { TestBed } from '../test/testbed';

// setup
require('source-map-support').install();
import { Setup } from './libs/setup';

// routing
import { AppRouter } from './router';

// boot
import * as mongooose from 'mongoose';
import { createServer, Server } from 'http';
// import * as https from 'https';
import { readFileSync } from 'fs';


class App {
	public app: express.Express;

	constructor() {
		console.time('Launch time');
		this.app = express();
		console.log('Launching Node REST API for ' + configUtil.getEnv('NODE_ENV') + '..');

		// SETUP
		Setup.initiate(this.app);

		// CONTROLLERS & ROUTER
		AppRouter.initiate(this.app);

		// BOOT
		this.boot();
	}

	private boot() {
		const uri = process.env.db || configGet<string>('database');

		mongooose.connect(uri, (error) => {
			if (error) {
				// if error is true, the problem is often with mongoDB not connection
				console.log('ERROR can\'t connect to mongoDB. Did you forget to run mongod?');
				console.log(error);
				mongooose.disconnect();
				process.exit(1);
				return;
			}
			let server: Server;
			if (configUtil.getEnv('NODE_ENV') === 'production') {
				// PRODUCTION
				const options = {
					// cert: readFileSync('/path/to/cert'),
					// key: readFileSync('/path/to/privkey')
				};
				// var server = https.createServer(options, app);
				server = createServer(this.app);

			} else {
				// DEVELOPMENT
				server = createServer(this.app);
			}
			server.listen(this.app.get('port'), () => {
				console.log(`Sotingane running on - Port ${this.app.get('port')}...`);
				console.timeEnd('Launch time');
			});
		});
	}
}

export default new App().app;
