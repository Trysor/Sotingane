import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { SettingsModel, accessRoles, Settings } from '../models';

import { Controller, GET, POST } from '../libs/routing';
import { SETTINGS_STATUS, status, JSchema, ajv, validate } from '../libs/validate';

import { Auth } from '../libs/auth';


export class SettingsController extends Controller {

	@POST({ path: '/', do: [Auth.ByToken, Auth.RequireRole(accessRoles.admin), validate(JSchema.SettingsSchema)] })
	public async postSettings(req: Req, res: Res, next: Next) {
		const settingsDoc: Settings = await SettingsModel.findOneAndUpdate({}, req.body, { upsert: true, new: true }).lean();
		if (!settingsDoc) {
			return res.status(422).send(status(SETTINGS_STATUS.DATA_UNPROCESSABLE));
		}
		return res.status(200).send(status(SETTINGS_STATUS.SETTINGS_UPDATED));
	}

	@GET({ path: '/', do: [] })
	public async getSettings(req: Req, res: Res, next: Next) {
		const settings: Settings = await SettingsModel.findOne({}, { _id: false, __v: false }).lean();
		if (!settings) {
			return res.status(404).send(status(SETTINGS_STATUS.SETTINGS_NONE_FOUND));
		}
		return res.status(200).send(settings);
	}

}


const settingsSchema = {
	'$id': JSchema.SettingsSchema.name,
	'type': 'object',
	'additionalProperties': false,
	'properties': {
		indexRoute: { 'type': 'string' },
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
	required: ['org', 'meta', 'footer']
};

if (ajv.validateSchema(settingsSchema)) {
	ajv.addSchema(settingsSchema, JSchema.SettingsSchema.name);
} else {
	console.error(`${JSchema.SettingsSchema.name} did not validate`);
}
