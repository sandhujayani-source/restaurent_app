const BillingService = require('../services/billing.service');

const BillingController = {
	async createForOrder(req, res, next) {
		try {
			const data = await BillingService.createForOrder(
				req.params.orderId,
				req.user
			);
			return res.status(data.created ? 201 : 200).json({
				success: true,
				message: data.created
					? 'Bill generated successfully.'
					: 'Existing bill returned.',
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const data = await BillingService.getById(req.params.id, req.user);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async getByOrderId(req, res, next) {
		try {
			const data = await BillingService.getByOrderId(
				req.params.orderId,
				req.user
			);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	}
};

module.exports = BillingController;

