import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { SettingsModel } from '../models';
import { AccessRoles, Settings } from '../../types';

import { Controller, GET, POST } from '../libs/routing';
import { SETTINGS_STATUS, status, JSchema, validate, RegisterSchema } from '../libs/validate';

import { Auth } from '../libs/auth';


export class SettingsController extends Controller {

	@POST({ path: '/', do: [Auth.ByToken, Auth.RequireRole(AccessRoles.admin), validate(JSchema.SettingsSchema)] })
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



	// ---------------------------------------
	// ------------ JSON SCHEMAS -------------
	// ---------------------------------------

	@RegisterSchema(JSchema.SettingsSchema)
	public get postSettingsSchema() {
		return {
			type: 'object',
			additionalProperties: false,
			properties: {
				indexRoute: { type: 'string' },
				org: { type: 'string' },
				meta: {
					type: 'object',
					properties: {
						title: { type: 'string' },
						desc: { type: 'string' },
					}
				},
				footer: {
					type: 'object',
					properties: {
						text: { type: 'string' },
						copyright: { type: 'string' },
					}
				}
			},
			required: ['org', 'meta', 'footer']
		};
	}
}
