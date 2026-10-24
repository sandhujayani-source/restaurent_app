const ReportService = require('../services/report.service');

const ReportController = {
	async summary(req, res, next) {
		try {
			const data = await ReportService.getSummary(req.query);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async sales(req, res, next) {
		try {
			const data = await ReportService.getDailySales(req.query);
			return res.status(200).json({ success: true, count: data.length, data });
		} catch (error) {
			next(error);
		}
	}
};

module.exports = ReportController;
