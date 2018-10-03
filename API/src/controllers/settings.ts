import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { SettingsModel, accessRoles, Settings } from '../models';

import { Controller, GET, PATCH } from '../libs/routing';
import { Auth } from '../libs/auth';


export class SettingsController extends Controller {

	@PATCH({ path: '/', handlers: [Auth.ByToken, Auth.RequireRole(accessRoles.admin)] }) // TODO: REQUIRE VALIDATION!!
	public async patchSettings(req: Req, res: Res, next: Next) {
		const settingsDoc: Settings = await SettingsModel.findOneAndUpdate({}, req.body, { upsert: true, new: true }).lean();
		if (!settingsDoc) {
			return res.status(500).send({}); // TODO: status
		}
		return res.status(200).send({}); // TODO: status
	}

	@GET({ path: '/', handlers: [] })
	public async getSettings(req: Req, res: Res, next: Next) {
		const settings: Settings = await SettingsModel.findOne({}, { _id: false, __v: false }).lean();
		return await res.status(200).send(settings);
	}

}


