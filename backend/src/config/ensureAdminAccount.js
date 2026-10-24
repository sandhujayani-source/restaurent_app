const bcrypt = require('bcrypt');

async function ensureAdminAccount(database, environment = process.env) {
	const username = environment.ADMIN_USERNAME || 'admin';
	const password = environment.ADMIN_PASSWORD || (
		environment.NODE_ENV === 'production' ? '' : 'admin@123'
	);
	const email = environment.ADMIN_EMAIL || 'admin@restaurant.local';

	const [roles] = await database.execute(
		'SELECT id FROM roles WHERE role_name = ? LIMIT 1',
		['admin']
	);
	if (!roles.length) {
		throw new Error('Administrator role is missing after database seeding.');
	}

	const [administratorAccounts] = await database.execute(
		`SELECT u.id
		 FROM users u
		 INNER JOIN roles r ON r.id = u.role_id
		 WHERE LOWER(r.role_name) = 'admin'
		 LIMIT 1`
	);
	if (administratorAccounts.length > 0) return;

	const [usernameOrEmailConflicts] = await database.execute(
		'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
		[username, email]
	);
	if (usernameOrEmailConflicts.length > 0) {
		throw new Error(
			'ADMIN_USERNAME or ADMIN_EMAIL is already used by a non-administrator account.'
		);
	}
	if (!password) {
		throw new Error(
			'ADMIN_PASSWORD must be configured to create the initial production administrator.'
		);
	}

	const passwordHash = await bcrypt.hash(password, 12);
	await database.execute(
		`INSERT INTO users (
			full_name, username, email, password_hash, role_id, is_active
		) VALUES (?, ?, ?, ?, ?, 1)`,
		['Administrator', username, email, passwordHash, roles[0].id]
	);

	console.log(`Created initial admin account: ${username}`);
}

module.exports = ensureAdminAccount;
