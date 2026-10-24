const SupplierRepository = require('../repositories/supplier.repository');

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
	const supplierId = Number(id);
	if (!Number.isInteger(supplierId) || supplierId < 1) {
		throw createError('Invalid supplier ID.', 400);
	}
	return supplierId;
}

function normalizeText(value, field, maxLength, required = false) {
	if (value == null && !required) return null;
	if (typeof value !== 'string') {
		throw createError(`${field} must be a string.`, 400);
	}
	const normalized = value.trim();
	if ((required && !normalized) || normalized.length > maxLength) {
		throw createError(
			`${field} must be ${required ? 'between 1 and ' : 'at most '}${maxLength} characters.`,
			400
		);
	}
	return normalized || null;
}

function normalizeSupplier(data) {
	const name = normalizeText(data.name, 'name', 150, true);
	const contactPerson = normalizeText(data.contactPerson, 'contactPerson', 150);
	const phone = normalizeText(data.phone, 'phone', 30);
	const email = normalizeText(data.email, 'email', 255);
	const address = normalizeText(data.address, 'address', 5000);
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw createError('email must be a valid email address.', 400);
	}
	return { name, contactPerson, phone, email: email?.toLowerCase() || null, address };
}

function validateFields(data) {
	const allowedFields = new Set([
		'name',
		'contactPerson',
		'phone',
		'email',
		'address'
	]);
	if (Object.keys(data).some(field => !allowedFields.has(field))) {
		throw createError('Supplier contains unsupported fields.', 400);
	}
}

const SupplierService = {
	async list(filters = {}) {
		validateObject(filters);
		if (Object.keys(filters).some(field => !['search', 'includeInactive'].includes(field))) {
			throw createError('Unsupported supplier filter.', 400);
		}
		let search;
		if (filters.search !== undefined) {
			if (typeof filters.search !== 'string' || filters.search.length > 100) {
				throw createError('search must be at most 100 characters.', 400);
			}
			search = filters.search.trim() || undefined;
		}
		let includeInactive = false;
		if (filters.includeInactive !== undefined) {
			if (!['true', 'false'].includes(String(filters.includeInactive))) {
				throw createError('includeInactive must be true or false.', 400);
			}
			includeInactive = String(filters.includeInactive) === 'true';
		}
		return SupplierRepository.findAll({ search, includeInactive });
	},

	async create(data) {
		validateObject(data);
		validateFields(data);
		const supplier = normalizeSupplier(data);
		const id = await SupplierRepository.create(supplier);
		return this.getById(id);
	},

	async getById(id) {
		const supplier = await SupplierRepository.findById(validateId(id));
		if (!supplier) throw createError('Supplier not found.', 404);
		return supplier;
	},

	async update(id, data) {
		const supplierId = validateId(id);
		validateObject(data);
		validateFields(data);
		const supplier = normalizeSupplier(data);
		const updated = await SupplierRepository.update(supplierId, supplier);
		if (!updated) throw createError('Active supplier not found.', 404);
		return this.getById(supplierId);
	},

	async deactivate(id) {
		const supplierId = validateId(id);
		const deactivated = await SupplierRepository.deactivate(supplierId);
		if (!deactivated) {
			const existing = await SupplierRepository.findById(supplierId);
			if (!existing) throw createError('Supplier not found.', 404);
			throw createError('Supplier is already deactivated.', 409);
		}
		return { id: supplierId, isActive: false };
	}
};

module.exports = SupplierService;
