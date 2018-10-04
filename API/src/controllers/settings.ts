import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { SettingsModel, accessRoles, Settings } from '../models';

import { Controller, GET, POST } from '../libs/routing';
import { SETTINGS_STATUS, status, JSchema, ajv, validateSchema, VALIDATION_FAILED } from '../libs/validate';

import { Auth } from '../libs/auth';


export class SettingsController extends Controller {

	@POST({ path: '/',
		handlers: [
			Auth.ByToken,
			Auth.RequireRole(accessRoles.admin),
			validateSchema(JSchema.SettingsSchema, VALIDATION_FAILED.SETTING_MODEL)
		]
	})
	public async postSettings(req: Req, res: Res, next: Next) {
		const settingsDoc: Settings = await SettingsModel.findOneAndUpdate({}, req.body, { upsert: true, new: true }).lean();
		if (!settingsDoc) {
			return res.status(422).send(status(SETTINGS_STATUS.DATA_UNPROCESSABLE));
		}
		return res.status(200).send(status(SETTINGS_STATUS.SETTINGS_UPDATED));
	}

	@GET({ path: '/', handlers: [] })
	public async getSettings(req: Req, res: Res, next: Next) {
		const settings: Settings = await SettingsModel.findOne({}, { _id: false, __v: false }).lean();
		if (!settings) {
			return res.status(404).send(status(SETTINGS_STATUS.SETTINGS_NONE_FOUND));
		}
		return res.status(200).send(settings);
	}

}


const settingsSchema = {
	'$id': JSchema.SettingsSchema,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		'theme': {
			'type': 'object',
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
			}
		},
		org: { 'type': 'string' },
		meta: {
			'type': 'object',
			'properties': {
				title: { 'type': 'string' },
				desc: { 'type': 'string' },
			}
		},
		footer: {
			'type': 'object',
			'properties': {
				text: { 'type': 'string' },
				copyright: { 'type': 'string' },
			}
		}
	},
	required: ['theme', 'org', 'meta', 'footer']
};

if (ajv.validateSchema(settingsSchema)) {
	ajv.addSchema(settingsSchema, JSchema.SettingsSchema);
} else {
	console.error(`${JSchema.SettingsSchema} did not validate`);
}
