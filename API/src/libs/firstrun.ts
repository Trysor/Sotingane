import { ThemeModel, UserModel, SettingsModel } from '../models';
import { Settings, Theme, User, AccessRoles } from '../../../Shared/types';
import { util as configUtil } from 'config';

export class FirstRunCheck {

	public static async PerformCheckAndInitialize() {
		const env = configUtil.getEnv('NODE_ENV');
		if (env === 'test') { return; }

		const settings = await SettingsModel.findOne({}).lean();
		if (!!settings) { return; }

		console.time('Performing first time setup');

		const adminUserPromise = new UserModel({
			username: 'Admin',
			username_lower: 'admin',
			password: 'admin',
			roles: [AccessRoles.admin, AccessRoles.member, AccessRoles.writer],
		} as User).save();

		const settingsPromise = new SettingsModel({
			footer: {
				copyright: 'copyright text',
				text: 'generic footer text'
			},
			indexRoute: 'home',
			meta: {
				desc: 'description',
				title: 'New Website'
			},
			org: 'Organization'
		} as Settings).save();

		const themePromise = new ThemeModel({
			name: 'Theme',
			vars: {
				'--app-prim-1': '#000',
				'--app-prim-2': '#000',
				'--app-prim-3': '#000',
				'--app-prim-c-1': '#000',
				'--app-prim-c-2': '#000',
				'--app-prim-c-3': '#000',

				'--app-acc-1': '#000',
				'--app-acc-2': '#000',
				'--app-acc-3': '#000',
				'--app-acc-c-1': '#000',
				'--app-acc-c-2': '#000',
				'--app-acc-c-3': '#000',

				'--color-text': '#000',
				'--color-background': '#000',
				'--color-header': '#000',
				'--color-sidepanel': '#000',
				'--color-material': '#000',
				'--color-content': '#000',
				'--color-shade': '#000',
				'--color-active': '#000',
				'--color-overlay': '#000',
				'--color-border': '#000',
				'--color-disabled': '#000',

				'--border': '#000',
				'--shadow': '#000',

				'--width-wrapper': '#000',
				'--width-side': '#000',
				'--width-max-field': '#000',
				'--height-header': '#000',
			}
		} as Theme).save();

		await Promise.all([adminUserPromise, settingsPromise, themePromise]);

		console.timeEnd('Performing first time setup');
	}
}
