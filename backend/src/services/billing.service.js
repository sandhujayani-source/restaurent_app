const BillingRepository = require('../repositories/billing.repository');
const SettingsService = require('./settings.service');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function validateId(id) {
	const value = Number(id);
	if (!Number.isInteger(value) || value < 1) {
		throw createError('Invalid bill or order ID.', 400);
	}
	return value;
}

function assertBillAccess(bill, user) {
	if (
		bill &&
		String(user.role).toLowerCase() === 'waiter' &&
		Number(bill.created_by) !== Number(user.userId)
	) {
		throw createError('Bill not found.', 404);
	}
}

const BillingService = {
	async createForOrder(orderId, user) {
		const validOrderId = validateId(orderId);
		if (!['admin', 'waiter'].includes(String(user.role).toLowerCase())) {
			throw createError('You do not have permission to generate bills.', 403);
		}

		const configuration = await SettingsService.getBillingConfiguration();
		const result = await BillingRepository.createFromOrder(
			validOrderId,
			configuration.taxRate,
			user
		);
		const bill = await BillingRepository.findById(result.id);

		return { ...bill, currency: configuration.currency, created: result.created };
	},

	async getById(id, user) {
		const billId = validateId(id);
		const bill = await BillingRepository.findById(billId);
		if (!bill) throw createError('Bill not found.', 404);
		assertBillAccess(bill, user);

		return bill;
	},

	async getByOrderId(orderId, user) {
		const validOrderId = validateId(orderId);
		const bill = await BillingRepository.findByOrderId(validOrderId);
		if (!bill) throw createError('Bill not found.', 404);
		assertBillAccess(bill, user);

		return bill;
	}
};

module.exports = BillingService;

