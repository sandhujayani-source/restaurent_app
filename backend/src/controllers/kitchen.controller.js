const KitchenService = require('../services/kitchen.service');

const KitchenController = {
	async list(req, res, next) {
		try {
			const data = await KitchenService.listTickets(req.query.status);
			return res.status(200).json({
				success: true,
				count: data.length,
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const data = await KitchenService.getTicket(req.params.id);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async updateStatus(req, res, next) {
		try {
			const data = await KitchenService.updateStatus(
				req.params.id,
				req.body?.status
			);
			return res.status(200).json({
				success: true,
				message: 'Kitchen ticket status updated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = KitchenController;

