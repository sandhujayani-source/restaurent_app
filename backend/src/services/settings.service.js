const SettingsRepository = require('../repositories/settings.repository');

const SETTING_KEYS = new Set(['tax_rate', 'payment_methods', 'currency']);
const METHOD_NAME = /^[a-z][a-z0-9_-]{1,29}$/;

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function formatSetting(row) {
	if (!row) return null;
	let value = row.setting_value;
	if (row.setting_key === 'payment_methods') {
		try {
			value = JSON.parse(value);
		} catch {
			value = [];
		}
	}
	if (row.setting_key === 'tax_rate') value = Number(value);

	return {
		key: row.setting_key,
		value,
		updatedAt: row.updated_at
	};
}

function validateValue(key, value) {
	if (!SETTING_KEYS.has(key)) {
		throw createError('Unsupported setting key.', 404);
	}

	if (key === 'tax_rate') {
		const rate = typeof value === 'number' ? value : Number(value);
		if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
			throw createError('tax_rate must be a number from 0 to 100 percent.', 400);
		}
		return rate.toFixed(2);
	}

	if (key === 'payment_methods') {
		if (
			!Array.isArray(value) ||
			value.length < 1 ||
			value.some(method =>
				typeof method !== 'string' ||
				!METHOD_NAME.test(method.trim().toLowerCase())
			)
		) {
			throw createError(
				'payment_methods must be a non-empty array of method identifiers.',
				400
			);
		}

		const methods = [...new Set(value.map(method => method.trim().toLowerCase()))];
		if (!methods.includes('cash')) {
			throw createError('payment_methods must include cash.', 400);
		}
		return JSON.stringify(methods);
	}

	if (
		typeof value !== 'string' ||
		!/^[A-Z]{3}$/.test(value)
	) {
		throw createError('currency must be a three-letter uppercase currency code.', 400);
	}
	return value;
}

const SettingsService = {
	async getSettings() {
		const rows = await SettingsRepository.findAll();
		return rows.map(formatSetting);
	},

	async getSetting(key) {
		if (!SETTING_KEYS.has(key)) {
			throw createError('Unsupported setting key.', 404);
		}
		return formatSetting(await SettingsRepository.findByKey(key));
	},

	async updateSetting(key, value) {
		const encodedValue = validateValue(key, value);
		return formatSetting(await SettingsRepository.upsert(key, encodedValue));
	},

	async getBillingConfiguration() {
		const [taxRate, paymentMethods, currency] = await Promise.all([
			this.getSetting('tax_rate'),
			this.getSetting('payment_methods'),
			this.getSetting('currency')
		]);

		if (!taxRate || !paymentMethods || !currency) {
			throw createError(
				'Configure tax_rate, payment_methods, and currency before billing.',
				503
			);
		}

		if (!Array.isArray(paymentMethods.value) || paymentMethods.value.length === 0) {
			throw createError('Configured payment_methods setting is invalid.', 503);
		}

		return {
			taxRate: taxRate.value,
			paymentMethods: paymentMethods.value,
			currency: currency.value
		};
	}
};

module.exports = SettingsService;

