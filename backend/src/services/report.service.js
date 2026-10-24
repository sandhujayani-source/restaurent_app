const ReportRepository = require('../repositories/report.repository');

const MAX_RANGE_DAYS = 366;

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function validateDate(value, field) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		throw createError(`${field} must be a valid YYYY-MM-DD date.`, 400);
	}
	const date = new Date(`${value}T00:00:00.000Z`);
	if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
		throw createError(`${field} must be a valid YYYY-MM-DD date.`, 400);
	}
	return value;
}

function validateRange(query = {}) {
	if (
		!query ||
		typeof query !== 'object' ||
		Array.isArray(query) ||
		Object.keys(query).some(key => !['from', 'to'].includes(key))
	) {
		throw createError('Provide only from and to date filters.', 400);
	}

	const from = validateDate(query.from, 'from');
	const to = validateDate(query.to, 'to');
	const fromTime = Date.parse(`${from}T00:00:00.000Z`);
	const toTime = Date.parse(`${to}T00:00:00.000Z`);
	const days = Math.floor((toTime - fromTime) / 86400000) + 1;
	if (days < 1) {
		throw createError('from must be on or before to.', 400);
	}
	if (days > MAX_RANGE_DAYS) {
		throw createError(`Date range cannot exceed ${MAX_RANGE_DAYS} days.`, 400);
	}
	return { from, to };
}

const ReportService = {
	async getSummary(query) {
		const range = validateRange(query);
		return ReportRepository.getSummary(range);
	},

	async getDailySales(query) {
		const range = validateRange(query);
		return ReportRepository.getDailySales(range);
	}
};

module.exports = ReportService;
