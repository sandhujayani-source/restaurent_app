const SettingsService = require('../services/settings.service');

const SettingsController = {
	async list(req, res, next) {
		try {
			const data = await SettingsService.getSettings();
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async update(req, res, next) {
		try {
			const data = await SettingsService.updateSetting(
				req.params.key,
				req.body?.value
			);
			return res.status(200).json({
				success: true,
				message: 'Setting updated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = SettingsController;

