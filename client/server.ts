// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';
import { enableProdMode } from '@angular/core';

import * as cookieParser from 'cookie-parser';

// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';

// Express node server
import * as express from 'express';
import { join } from 'path';

// App Server module
import { AppServerModule } from './src/main.server';


// Express server
const app = express();
app.use(cookieParser());

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist', 'browser');

app.engine('html', ngExpressEngine({ bootstrap: AppServerModule }));

app.set('view engine', 'html');
app.set('views', DIST_FOLDER);
app.get('*.*', express.static(DIST_FOLDER, { maxAge: '1y' })); // Files
app.get('*', (req, res) => res.render('index', { req, res, cache: true })); // Catch-all

// Start up the Node server
app.listen(PORT, () => {
	console.log(`Node server listening on http://localhost:${PORT}`);
});
