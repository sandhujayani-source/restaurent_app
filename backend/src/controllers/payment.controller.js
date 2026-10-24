const PaymentService = require('../services/payment.service');

const PaymentController = {
	async create(req, res, next) {
		try {
			const data = await PaymentService.createPayment(
				req.body,
				req.user,
				req.get('Idempotency-Key')
			);

			return res.status(data.replayed ? 200 : 201).json({
				success: true,
				message: data.replayed
					? 'Existing payment returned for this Idempotency-Key.'
					: 'Payment recorded successfully.',
				data
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = PaymentController;

