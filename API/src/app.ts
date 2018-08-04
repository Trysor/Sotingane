import * as express from 'express';
import { get as configGet, util as configUtil } from 'config';
import 'source-map-support/register';

import * as mongoose from 'mongoose';
import { Server } from 'http';

import { Setup } from './libs/setup';
import { AppRouter } from './router';


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
		let server: Server;
		this.app.on('db_ready', () => {
			server = this.app.listen(this.app.get('port'), () => {
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
				process.exit(1);
				return;
			}
			this.app.emit('db_ready');
		});

		process.on('exit', () => {
			if (server) { server.close(); }
			mongoose.disconnect();
			mongoose.connection.close();
		});
	}
}

export default new App().app;
