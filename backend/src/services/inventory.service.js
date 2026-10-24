const InventoryRepository = require('../repositories/inventory.repository');
const SupplierRepository = require('../repositories/supplier.repository');

const MAX_QUANTITY = 999999999.999;

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function validateObject(data) {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		throw createError('Request body must be a JSON object.', 400);
	}
}

function validateId(id) {
	const inventoryId = Number(id);
	if (!Number.isInteger(inventoryId) || inventoryId < 1) {
		throw createError('Invalid inventory item ID.', 400);
	}
	return inventoryId;
}

function normalizeQuantity(value, field) {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_QUANTITY) {
		throw createError(`${field} must be a non-negative number within the supported range.`, 400);
	}
	if (Math.abs(Math.round(value * 1000) - value * 1000) > 1e-8) {
		throw createError(`${field} must have at most three decimal places.`, 400);
	}
	return value.toFixed(3);
}

function normalizeInventory(data) {
	const itemName = typeof data.itemName === 'string' ? data.itemName.trim() : '';
	const unit = typeof data.unit === 'string' ? data.unit.trim() : '';
	if (!itemName || itemName.length > 150) {
		throw createError('itemName must be between 1 and 150 characters.', 400);
	}
	if (!unit || unit.length > 30) {
		throw createError('unit must be between 1 and 30 characters.', 400);
	}

	const supplierId = data.supplierId ?? null;
	if (
		supplierId !== null &&
		(!Number.isInteger(supplierId) || supplierId < 1)
	) {
		throw createError('supplierId must be a positive integer or null.', 400);
	}

	return {
		itemName,
		unit,
		quantity: normalizeQuantity(data.quantity, 'quantity'),
		reorderLevel: normalizeQuantity(data.reorderLevel, 'reorderLevel'),
		supplierId
	};
}

async function ensureActiveSupplier(supplierId) {
	if (supplierId === null) return;
	const supplier = await SupplierRepository.findById(supplierId);
	if (!supplier) throw createError('Supplier not found.', 404);
	if (!supplier.is_active) {
		throw createError('Inventory can only be assigned to an active supplier.', 409);
	}
}

const InventoryService = {
	async list(filters = {}) {
		validateObject(filters);
		if (Object.keys(filters).some(field => !['search', 'lowStockOnly'].includes(field))) {
			throw createError('Unsupported inventory filter.', 400);
		}
		let search;
		if (filters.search !== undefined) {
			if (typeof filters.search !== 'string' || filters.search.length > 100) {
				throw createError('search must be at most 100 characters.', 400);
			}
			search = filters.search.trim() || undefined;
		}
		let lowStockOnly = false;
		if (filters.lowStockOnly !== undefined) {
			if (!['true', 'false'].includes(String(filters.lowStockOnly))) {
				throw createError('lowStockOnly must be true or false.', 400);
			}
			lowStockOnly = String(filters.lowStockOnly) === 'true';
		}
		return InventoryRepository.findAll({ search, lowStockOnly });
	},

	async create(data) {
		validateObject(data);
		const allowedFields = new Set([
			'itemName',
			'unit',
			'quantity',
			'reorderLevel',
			'supplierId'
		]);
		if (Object.keys(data).some(field => !allowedFields.has(field))) {
			throw createError('Inventory item contains unsupported fields.', 400);
		}
		const item = normalizeInventory(data);
		await ensureActiveSupplier(item.supplierId);
		const id = await InventoryRepository.create(item);
		return this.getById(id);
	},

	async getById(id) {
		const item = await InventoryRepository.findById(validateId(id));
		if (!item) throw createError('Inventory item not found.', 404);
		return item;
	},

	async update(id, data) {
		const inventoryId = validateId(id);
		validateObject(data);
		const allowedFields = new Set([
			'itemName',
			'unit',
			'quantity',
			'reorderLevel',
			'supplierId'
		]);
		if (Object.keys(data).some(field => !allowedFields.has(field))) {
			throw createError('Inventory item contains unsupported fields.', 400);
		}
		const item = normalizeInventory(data);
		await ensureActiveSupplier(item.supplierId);
		const updated = await InventoryRepository.update(inventoryId, item);
		if (!updated) throw createError('Inventory item not found.', 404);
		return this.getById(inventoryId);
	},

	async updateQuantity(id, data) {
		const inventoryId = validateId(id);
		validateObject(data);
		if (Object.keys(data).some(field => field !== 'quantity')) {
			throw createError('Quantity update contains unsupported fields.', 400);
		}
		const quantity = normalizeQuantity(data.quantity, 'quantity');
		const updated = await InventoryRepository.updateQuantity(inventoryId, quantity);
		if (!updated) throw createError('Inventory item not found.', 404);
		return this.getById(inventoryId);
	}
};

module.exports = InventoryService;
