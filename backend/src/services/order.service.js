const crypto = require('node:crypto');
const OrderRepository = require('../repositories/order.repository');

const VALID_STATUSES = new Set([
	'pending',
	'preparing',
	'ready',
	'completed',
	'cancelled'
]);

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function validateOrderPayload(data) {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		throw createError('Request body must be a JSON object.', 400);
	}
	const allowedFields = new Set(['tableId', 'notes', 'items']);
	if (Object.keys(data).some(field => !allowedFields.has(field))) {
		throw createError('Order contains unsupported fields.', 400);
	}
	if (
		data.tableId !== undefined &&
		data.tableId !== null &&
		(!Number.isInteger(data.tableId) || data.tableId < 1)
	) {
		throw createError('tableId must be a positive integer or null.', 400);
	}
	if (
		data.notes !== undefined &&
		data.notes !== null &&
		(typeof data.notes !== 'string' || data.notes.length > 2000)
	) {
		throw createError('Order notes must be at most 2000 characters.', 400);
	}
	if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 50) {
		throw createError('An order must contain between 1 and 50 items.', 400);
	}

	const seenMenuItemIds = new Set();
	const items = data.items.map(item => {
		if (!item || typeof item !== 'object' || Array.isArray(item)) {
			throw createError('Each order item must be a JSON object.', 400);
		}
		const allowedItemFields = new Set(['menuItemId', 'quantity', 'notes']);
		if (Object.keys(item).some(field => !allowedItemFields.has(field))) {
			throw createError('Order item contains unsupported fields.', 400);
		}
		if (!Number.isInteger(item.menuItemId) || item.menuItemId < 1) {
			throw createError('menuItemId must be a positive integer.', 400);
		}
		if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
			throw createError('Item quantity must be a whole number from 1 to 999.', 400);
		}
		if (
			item.notes !== undefined &&
			item.notes !== null &&
			(typeof item.notes !== 'string' || item.notes.length > 1000)
		) {
			throw createError('Item notes must be at most 1000 characters.', 400);
		}
		if (seenMenuItemIds.has(item.menuItemId)) {
			throw createError('Each menu item may appear only once in an order.', 400);
		}
		seenMenuItemIds.add(item.menuItemId);

		return {
			menuItemId: item.menuItemId,
			quantity: item.quantity,
			notes: item.notes?.trim() || null
		};
	});

	return {
		tableId: data.tableId ?? null,
		notes: data.notes?.trim() || null,
		items
	};
}

const OrderService = {
	async createOrder(data, user, idempotencyKey) {
		const payload = validateOrderPayload(data);
		if (!user || !Number.isInteger(Number(user.userId))) {
			throw createError('Authenticated user is required to create an order.', 401);
		}
		if (!['admin', 'waiter'].includes(String(user.role).toLowerCase())) {
			throw createError('You do not have permission to create orders.', 403);
		}
		if (
			idempotencyKey !== undefined &&
			(typeof idempotencyKey !== 'string' ||
				!idempotencyKey.trim() ||
				idempotencyKey.trim().length > 100)
		) {
			throw createError('Idempotency-Key must be between 1 and 100 characters.', 400);
		}

		const key = idempotencyKey?.trim() || null;
		const requestHash = key
			? crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
			: null;
		const created = await OrderRepository.createOrder({
			...payload,
			userId: Number(user.userId),
			idempotencyKey: key,
			requestHash
		});
		const order = await OrderRepository.findById(created.id);

		return { ...order, replayed: created.replayed };
	},

	async listOrders(filters, user) {
		const allowedFields = new Set(['status', 'tableId']);
		if (Object.keys(filters).some(field => !allowedFields.has(field))) {
			throw createError('Unsupported order filter.', 400);
		}
		let status;
		if (filters.status !== undefined) {
			status = String(filters.status).toLowerCase();
			if (!VALID_STATUSES.has(status)) {
				throw createError('Invalid order status filter.', 400);
			}
		}
		let tableId;
		if (filters.tableId !== undefined) {
			tableId = Number(filters.tableId);
			if (!Number.isInteger(tableId) || tableId < 1) {
				throw createError('tableId must be a positive integer.', 400);
			}
		}

		const query = { status, tableId };
		if (String(user.role).toLowerCase() === 'waiter') {
			query.createdBy = Number(user.userId);
		}

		return OrderRepository.findAll(query);
	},

	async getOrder(id, user) {
		const orderId = Number(id);
		if (!Number.isInteger(orderId) || orderId < 1) {
			throw createError('Invalid order ID.', 400);
		}
		const order = await OrderRepository.findById(orderId);
		if (!order) {
			throw createError('Order not found.', 404);
		}
		if (
			String(user.role).toLowerCase() === 'waiter' &&
			Number(order.created_by) !== Number(user.userId)
		) {
			throw createError('Order not found.', 404);
		}

		return order;
	},

	async updateStatus(id, status, user) {
		const orderId = Number(id);
		const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : '';
		if (!Number.isInteger(orderId) || orderId < 1) {
			throw createError('Invalid order ID.', 400);
		}
		if (!['completed', 'cancelled'].includes(normalizedStatus)) {
			throw createError('Status must be completed or cancelled.', 400);
		}
		if (!['admin', 'waiter'].includes(String(user.role).toLowerCase())) {
			throw createError('You do not have permission to update this order.', 403);
		}

		return OrderRepository.updateStatus(orderId, {
			status: normalizedStatus,
			userId: Number(user.userId),
			role: String(user.role)
		});
	}
};

module.exports = OrderService;

