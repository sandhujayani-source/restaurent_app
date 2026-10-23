const PLACEHOLDER_JWT_SECRETS = new Set([
	'replace_with_your_own_secret',
	'replace_with_a_long_random_secret'
]);

function getJwtSecret(secret = process.env.JWT_SECRET) {
	if (
		typeof secret !== 'string' ||
		secret.trim().length < 32 ||
		PLACEHOLDER_JWT_SECRETS.has(secret.trim().toLowerCase())
	) {
		const error = new Error(
			'JWT_SECRET must be set to a random secret with at least 32 characters.'
		);
		error.statusCode = 500;
		throw error;
	}

	return secret;
}

function validateEnvironment() {
	getJwtSecret();
}

module.exports = {
	getJwtSecret,
	validateEnvironment
};

