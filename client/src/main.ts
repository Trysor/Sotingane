import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppBrowserModule } from './app/app.browser.module';
import { env } from './environments/environment';

if (env.production) {
	enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
	platformBrowserDynamic().bootstrapModule(AppBrowserModule).catch(err => console.log(err));
});

