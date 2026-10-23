const KitchenRepository = require('../repositories/kitchen.repository');

const VALID_STATUSES = new Set(['pending', 'preparing', 'ready']);

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

const KitchenService = {
	async listTickets(status) {
		let normalizedStatus;
		if (status !== undefined) {
			normalizedStatus = typeof status === 'string'
				? status.toLowerCase()
				: '';
			if (!VALID_STATUSES.has(normalizedStatus)) {
				throw createError('Invalid kitchen ticket status filter.', 400);
			}
		}

		return KitchenRepository.findAll(normalizedStatus);
	},

	async getTicket(id) {
		const ticketId = Number(id);
		if (!Number.isInteger(ticketId) || ticketId < 1) {
			throw createError('Invalid kitchen ticket ID.', 400);
		}

		const ticket = await KitchenRepository.findById(ticketId);
		if (!ticket) throw createError('Kitchen ticket not found.', 404);
		return ticket;
	},

	async updateStatus(id, status) {
		const ticketId = Number(id);
		const normalizedStatus = typeof status === 'string'
			? status.toLowerCase()
			: '';

		if (!Number.isInteger(ticketId) || ticketId < 1) {
			throw createError('Invalid kitchen ticket ID.', 400);
		}
		if (!['preparing', 'ready'].includes(normalizedStatus)) {
			throw createError('Status must be preparing or ready.', 400);
		}

		return KitchenRepository.updateStatus(ticketId, normalizedStatus);
	}
};

module.exports = KitchenService;

