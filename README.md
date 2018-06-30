# Sotingane
A Content Management System (CMS) based on the MEAN stack.

[![Build Status](https://travis-ci.com/Trysor/Sotingane.svg?branch=master)](https://travis-ci.org/Trysor/Sotingane)

## Projects

#### API

Processes user data, handles authentication and storage. Uses [MongoDB](https://www.mongodb.com) for storage.

#### Client

[Angular](https://angular.io/) SPA CMS framework. Includes [Angular Universal](https://universal.angular.io/) for SSR.

#### CKEditor

A custom build of [CKEditor 5](https://ckeditor.com/ckeditor-5/). Used by the client. 


## Setup

Each of the projects require setup before they can be built. Install npm packages in each project, and follow instructions below.

#### API

* [MongoDB](https://www.mongodb.com) is a prerequisite.
* Config json files need to be configured and put in the config folder. The naming convention is that of: <node_environment>.json. e.g. production.json. Configure a path to your database, along with port, allowed origins (your website(s) domain(s)), logging mode and a secret (password pepper).
  * See API/config/test.json as an example.

#### CKEditor

* Configure the toolbar and plugins in CKEditor/ckeditor.ts
* Webpack the Editor by using npm run webpack in the CKEditor folder. This step is required for the Client to work.

#### Client

* Create environment.prod.ts in the Client/src/environments folder. Configure it to match details for your website.
  * See Client/src/environments/environment.ts as an example.


## Building and deploying

Build and pack the projects:
* Webpack the API (npm run webpack)
* Webpack the Client (npm run build:ssr)

On the website host server:
1. Deploy API: copy dist/api.js along with package.json and the config folder. Do not change the folder structure.
2. run npm i --only=production to install production-only packages required by the API.
3. Deploy Client: copy dist/server.js along with dist/browser folder. Place server.js in dist's parent folder.
4. Utilize a web server (e.g. Nginx) as a reverse proxy to point all /api requests to your API entrypoint and port, all file requests to your dist/browser folder and all other requests to point to dist/browser/index.html (as this is required for the SPA to work).
5. Use a nodejs process manager (e.g. PM2) to manage the server.js and api.js node processes, and boot them up.