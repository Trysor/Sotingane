import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { ThemeModel, accessRoles, Theme } from '../models';

import { Controller, GET, POST, PATCH } from '../libs/routing';
import { THEME_STATUS, status, JSchema, ajv, validate } from '../libs/validate';

import { Auth } from '../libs/auth';


export class ThemeController extends Controller {

	@PATCH({	path: '/:theme',	do: [Auth.ByToken, Auth.RequireRole(accessRoles.admin), validate(JSchema.ThemeSchema)] })
	@POST({		path: '/',			do: [Auth.ByToken, Auth.RequireRole(accessRoles.admin), validate(JSchema.ThemeSchema)] })
	public async postPatchTheme(req: Req, res: Res, next: Next) {
		const isPatch = (!!req.params && !!req.params.themed);
		const searchQuery = isPatch ? { name: req.params.theme } : {};
		const themeDoc: Theme = await ThemeModel.findOneAndUpdate(searchQuery, req.body, { upsert: !isPatch, new: true }).lean();
		if (!themeDoc) {
			return res.status(422).send(status(THEME_STATUS.DATA_UNPROCESSABLE));
		}
		return res.status(200).send(status(THEME_STATUS.THEME_UPDATED));
	}


	@GET({ path: '/', do: [] })
	public async getSettings(req: Req, res: Res, next: Next) {
		const themeDoc: Theme = await ThemeModel.findOne({}, { _id: false, __v: false }).lean();
		if (!themeDoc) {
			return res.status(404).send(status(THEME_STATUS.THEME_NONE_FOUND));
		}
		return res.status(200).send(themeDoc);
	}

}


const ThemeSchema = {
	'$id': JSchema.ThemeSchema.name,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'name': { 'type': 'string' },
		'vars': {
			'type': 'object',
			'additionalProperties': false,
			'properties': {
				'--app-prim-1': { 'type': 'string' },
				'--app-prim-2': { 'type': 'string' },
				'--app-prim-3': { 'type': 'string' },
				'--app-prim-c-1': { 'type': 'string' },
				'--app-prim-c-2': { 'type': 'string' },
				'--app-prim-c-3': { 'type': 'string' },

				'--app-acc-1': { 'type': 'string' },
				'--app-acc-2': { 'type': 'string' },
				'--app-acc-3': { 'type': 'string' },
				'--app-acc-c-1': { 'type': 'string' },
				'--app-acc-c-2': { 'type': 'string' },
				'--app-acc-c-3': { 'type': 'string' },

				'--color-text': { 'type': 'string' },

				'--color-background': { 'type': 'string' },
				'--color-header': { 'type': 'string' },
				'--color-sidepanel': { 'type': 'string' },
				'--color-material': { 'type': 'string' },
				'--color-content': { 'type': 'string' },
				'--color-shade': { 'type': 'string' },
				'--color-active': { 'type': 'string' },
				'--color-overlay': { 'type': 'string' },
				'--color-border': { 'type': 'string' },
				'--color-disabled': { 'type': 'string' },

				'--border': { 'type': 'string' },
				'--shadow': { 'type': 'string' },

				'--width-wrapper': { 'type': 'string' },
				'--width-side': { 'type': 'string' },
				'--width-max-field': { 'type': 'string' },
				'--height-header': { 'type': 'string' },
			},
			required: [
				'--app-prim-1', '--app-prim-2', '--app-prim-3', '--app-prim-c-1', '--app-prim-c-2', '--app-prim-c-3',
				'--app-acc-1', '--app-acc-2', '--app-acc-3', '--app-acc-c-1', '--app-acc-c-2', '--app-acc-c-3',

				'--color-text',

				'--color-background', '--color-header', '--color-sidepanel', '--color-material', '--color-content', '--color-shade', '--color-active',
				'--color-overlay', '--color-border', '--color-disabled',

				'--border', '--shadow',

				'--width-wrapper', '--width-side', '--width-max-field', '--height-header'
			]
		}
	},
	required: ['name', 'vars']
};

if (ajv.validateSchema(ThemeSchema)) {
	ajv.addSchema(ThemeSchema, JSchema.ThemeSchema.name);
} else {
	console.error(`${JSchema.ThemeSchema.name} did not validate`);
}
