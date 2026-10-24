const CustomerRepository = require('../repositories/customer.repository');

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

function validateFields(data, allowedFields) {
	if (Object.keys(data).some(field => !allowedFields.has(field))) {
		throw createError('Customer contains unsupported fields.', 400);
	}
}

function normalizeCustomer(data) {
	const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
	if (!fullName || fullName.length > 150) {
		throw createError('fullName must be between 1 and 150 characters.', 400);
	}

	let phone = data.phone ?? null;
	if (phone !== null) {
		if (typeof phone !== 'string' || phone.trim().length > 30) {
			throw createError('phone must be at most 30 characters.', 400);
		}
		phone = phone.trim() || null;
	}

	let email = data.email ?? null;
	if (email !== null) {
		if (
			typeof email !== 'string' ||
			email.trim().length > 255 ||
			(email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
		) {
			throw createError('email must be a valid email address.', 400);
		}
		email = email.trim().toLowerCase() || null;
	}

	return { fullName, phone, email };
}

function validateId(id) {
	const customerId = Number(id);
	if (!Number.isInteger(customerId) || customerId < 1) {
		throw createError('Invalid customer ID.', 400);
	}
	return customerId;
}

const CustomerService = {
	async list(filters = {}) {
		validateObject(filters);
		if (Object.keys(filters).some(field => field !== 'search')) {
			throw createError('Unsupported customer filter.', 400);
		}
		let search;
		if (filters.search !== undefined) {
			if (typeof filters.search !== 'string' || filters.search.length > 100) {
				throw createError('search must be at most 100 characters.', 400);
			}
			search = filters.search.trim() || undefined;
		}
		return CustomerRepository.findAll({ search });
	},

	async create(data) {
		validateObject(data);
		validateFields(data, new Set(['fullName', 'phone', 'email']));
		const customer = normalizeCustomer(data);
		const id = await CustomerRepository.create(customer);
		return this.getById(id);
	},

	async getById(id) {
		const customer = await CustomerRepository.findById(validateId(id));
		if (!customer) throw createError('Customer not found.', 404);
		return customer;
	},

	async update(id, data) {
		const customerId = validateId(id);
		validateObject(data);
		validateFields(data, new Set(['fullName', 'phone', 'email']));
		const customer = normalizeCustomer(data);
		const updated = await CustomerRepository.update(customerId, customer);
		if (!updated) throw createError('Customer not found.', 404);
		return this.getById(customerId);
	}
};

module.exports = CustomerService;
