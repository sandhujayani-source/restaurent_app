const crypto = require('node:crypto');
const PaymentRepository = require('../repositories/payment.repository');
const BillingRepository = require('../repositories/billing.repository');
const SettingsService = require('./settings.service');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function parseAmount(value) {
	if (typeof value !== 'number' && typeof value !== 'string') {
		throw createError('amount must be a positive monetary value.', 400);
	}
	const text = String(value);
	if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(text)) {
		throw createError('amount must have at most two decimal places.', 400);
	}
	const [whole, fraction = ''] = text.split('.');
	const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
	if (cents < 1 || cents > 9999999999) {
		throw createError('amount must be greater than zero and within the supported range.', 400);
	}
	return { cents, decimal: (cents / 100).toFixed(2) };
}

const PaymentService = {
	async createPayment(data, user, idempotencyKey) {
		if (!data || typeof data !== 'object' || Array.isArray(data)) {
			throw createError('Request body must be a JSON object.', 400);
		}
		const allowedFields = new Set([
			'billId',
			'paymentMethod',
			'amount',
			'transactionReference'
		]);
		if (Object.keys(data).some(field => !allowedFields.has(field))) {
			throw createError('Payment contains unsupported fields.', 400);
		}

		const billId = Number(data.billId);
		if (!Number.isInteger(billId) || billId < 1) {
			throw createError('billId must be a positive integer.', 400);
		}
		if (typeof data.paymentMethod !== 'string' || !data.paymentMethod.trim()) {
			throw createError('paymentMethod is required.', 400);
		}
		const paymentMethod = data.paymentMethod.trim().toLowerCase();
		const amount = parseAmount(data.amount);
		const transactionReference = data.transactionReference ?? null;
		if (
			transactionReference !== null &&
			(typeof transactionReference !== 'string' ||
				transactionReference.length > 100)
		) {
			throw createError('transactionReference must be at most 100 characters.', 400);
		}
		if (
			idempotencyKey !== undefined &&
			(typeof idempotencyKey !== 'string' ||
				!idempotencyKey.trim() ||
				idempotencyKey.trim().length > 100)
		) {
			throw createError('Idempotency-Key must be between 1 and 100 characters.', 400);
		}
		if (!['admin', 'waiter'].includes(String(user.role).toLowerCase())) {
			throw createError('You do not have permission to record payments.', 403);
		}

		const configuration = await SettingsService.getBillingConfiguration();
		if (!configuration.paymentMethods.includes(paymentMethod)) {
			throw createError('Payment method is not configured.', 400);
		}
		const bill = await BillingRepository.findById(billId);
		if (!bill) throw createError('Bill not found.', 404);
		if (
			String(user.role).toLowerCase() === 'waiter' &&
			Number(bill.created_by) !== Number(user.userId)
		) {
			throw createError('Bill not found.', 404);
		}

		const key = idempotencyKey?.trim() || null;
		const requestBody = {
			billId,
			paymentMethod,
			amount: amount.decimal,
			transactionReference
		};
		const requestHash = key
			? crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex')
			: null;
		const created = await PaymentRepository.create({
			...requestBody,
			amount,
			idempotencyKey: key,
			requestHash
		});
		const payment = await PaymentRepository.findById(created.id);

		return {
			...payment,
			currency: configuration.currency,
			replayed: created.replayed
		};
	}
};

module.exports = PaymentService;

