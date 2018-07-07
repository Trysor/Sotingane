import * as express from 'express';
import { get as configGet, util as configUtil } from 'config';

// setup
require('source-map-support').install();
import { Setup } from './libs/setup';

// routing
import { AppRouter } from './router';

// boot
import * as mongoose from 'mongoose';

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
		this.app.on('db_ready', () => {
			this.app.listen(this.app.get('port'), () => {
				console.log(`Sotingane running on - Port ${this.app.get('port')}...`);
				console.timeEnd('Launch time');
				this.app.emit('launched');
			});
		});

		const uri = process.env.db || configGet<string>('database');

		mongoose.connect(uri, { keepAlive: 120, useNewUrlParser: true }, (error) => {
			if (error) {
				// if error is true, the problem is often with mongoDB not connection
				console.error('Mongoose connection error:', error.message);
				mongoose.disconnect();
				process.exit(1);
				return;
			}
			this.app.emit('db_ready');
		});
	}
}

export default new App().app;
