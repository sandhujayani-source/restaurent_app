const OrderService = require('../services/order.service');

const OrderController = {
	async list(req, res, next) {
		try {
			const data = await OrderService.listOrders(req.query, req.user);

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
			const data = await OrderService.getOrder(req.params.id, req.user);

			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	},

	async create(req, res, next) {
		try {
			const idempotencyKey = req.get('Idempotency-Key');
			const data = await OrderService.createOrder(
				req.body,
				req.user,
				idempotencyKey
			);
			const statusCode = data.replayed ? 200 : 201;

			return res.status(statusCode).json({
				success: true,
				message: data.replayed
					? 'Existing order returned for this Idempotency-Key.'
					: 'Order created successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	},

	async updateStatus(req, res, next) {
		try {
			const data = await OrderService.updateStatus(
				req.params.id,
				req.body?.status,
				req.user
			);

			return res.status(200).json({
				success: true,
				message: 'Order status updated successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = OrderController;

