import * as express from 'express';
import { get as configGet, util as configUtil } from 'config';

// setup
require('source-map-support').install();
import { Setup } from './libs/setup';

// routing
import { AppRouter } from './router';

// boot
import * as mongooose from 'mongoose';

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
				console.log(error.message);
				mongooose.disconnect();
				process.exit(1);
				return;
			}
			this.app.listen(this.app.get('port'), () => {
				console.log(`Sotingane running on - Port ${this.app.get('port')}...`);
				console.timeEnd('Launch time');
			});
		});
	}
}

export default new App().app;
