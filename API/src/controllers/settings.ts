import { Request as Req, Response as Res, NextFunction as Next } from 'express';

import { SettingsModel } from '../models';
import { Router } from 'express';


export class SettingsController {
	public router: Router;

	constructor(router: Router) {
		this.router = router;
	}

	public async patchSettings(req: Req, res: Res, next: Next) {




	}

	public async getSettings(req: Req, res: Res, next: Next) {
		return await res.status(200).send(SettingsModel.findOne({}).lean());
	}

}


