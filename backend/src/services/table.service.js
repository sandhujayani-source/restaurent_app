const TableRepository = require('../repositories/table.repository');

const VALID_STATUSES = new Set([
	'available',
	'occupied',
	'reserved',
	'maintenance'
]);

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function validatePayload(data) {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		throw createError('Request body must be a JSON object.', 400);
	}
}

function validateTableNumber(tableNumber) {
	if (
		typeof tableNumber !== 'string' ||
		!tableNumber.trim() ||
		tableNumber.trim().length > 30
	) {
		throw createError('Table number must be between 1 and 30 characters.', 400);
	}

	return tableNumber.trim();
}

function validateCapacity(capacity) {
	if (!Number.isInteger(capacity) || capacity < 1 || capacity > 65535) {
		throw createError('Capacity must be a positive whole number.', 400);
	}
}

function validateStatus(status) {
	if (typeof status !== 'string' || !VALID_STATUSES.has(status.toLowerCase())) {
		throw createError(
			'Status must be available, occupied, reserved, or maintenance.',
			400
		);
	}

	return status.toLowerCase();
}

const TableService = {
	async getTables(status) {
		const normalizedStatus = status === undefined
			? undefined
			: validateStatus(status);

		return TableRepository.findAll(normalizedStatus);
	},

	async getTable(id) {
		const tableId = Number(id);

		if (!Number.isInteger(tableId) || tableId < 1) {
			throw createError('Invalid table ID.', 400);
		}

		const table = await TableRepository.findById(tableId);

		if (!table) {
			throw createError('Table not found.', 404);
		}

		return table;
	},

	async createTable(data) {
		validatePayload(data);
		const tableNumber = validateTableNumber(data.tableNumber);
		const capacity = data.capacity === undefined ? 1 : data.capacity;
		validateCapacity(capacity);
		const status = data.status === undefined
			? 'available'
			: validateStatus(data.status);

		const id = await TableRepository.create({
			tableNumber,
			capacity,
			status
		});

		return this.getTable(id);
	},

	async updateTable(id, data) {
		validatePayload(data);
		const tableId = Number(id);

		if (!Number.isInteger(tableId) || tableId < 1) {
			throw createError('Invalid table ID.', 400);
		}

		const changes = {};

		if (Object.hasOwn(data, 'tableNumber')) {
			changes.tableNumber = validateTableNumber(data.tableNumber);
		}

		if (Object.hasOwn(data, 'capacity')) {
			validateCapacity(data.capacity);
			changes.capacity = data.capacity;
		}

		if (Object.hasOwn(data, 'status')) {
			changes.status = validateStatus(data.status);
		}

		if (Object.hasOwn(data, 'isActive')) {
			if (typeof data.isActive !== 'boolean') {
				throw createError('isActive must be a boolean.', 400);
			}
			changes.isActive = data.isActive ? 1 : 0;
		}

		if (Object.keys(changes).length === 0) {
			throw createError('Provide at least one table field to update.', 400);
		}

		const existingTable = await TableRepository.findById(tableId);
		if (!existingTable) {
			throw createError('Table not found.', 404);
		}

		await TableRepository.update(tableId, changes);

		if (changes.isActive === 0) {
			return { id: tableId, isActive: false };
		}

		return this.getTable(tableId);
	},

	async deactivateTable(id) {
		const tableId = Number(id);

		if (!Number.isInteger(tableId) || tableId < 1) {
			throw createError('Invalid table ID.', 400);
		}

		const deactivated = await TableRepository.deactivate(tableId);

		if (!deactivated) {
			throw createError('Table not found.', 404);
		}

		return { id: tableId, isActive: false };
	}
};

module.exports = TableService;

