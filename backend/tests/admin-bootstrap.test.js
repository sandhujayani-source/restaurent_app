const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { test } = require('node:test');

const ensureAdminAccount = require('../src/config/ensureAdminAccount');

function createDatabase({ adminExists = false, conflictExists = false } = {}) {
	const calls = [];
	return {
		calls,
		async execute(sql, values = []) {
			calls.push({ sql, values });
			if (sql.includes('SELECT id FROM roles')) return [[{ id: 17 }], []];
			if (sql.includes('INNER JOIN roles')) {
				return [adminExists ? [{ id: 1 }] : [], []];
			}
			if (sql.includes('SELECT id FROM users')) {
				return [conflictExists ? [{ id: 2 }] : [], []];
			}
			if (sql.includes('INSERT INTO users')) return [{ insertId: 3 }, []];
			throw new Error(`Unexpected query: ${sql}`);
		}
	};
}

test('preserves an existing production administrator without a bootstrap password', async () => {
	const database = createDatabase({ adminExists: true });

	await ensureAdminAccount(database, { NODE_ENV: 'production' });

	assert.equal(database.calls.length, 2);
});

test('fails clearly if production has no administrator or bootstrap password', async () => {
	const database = createDatabase();

	await assert.rejects(
		ensureAdminAccount(database, { NODE_ENV: 'production' }),
		/ADMIN_PASSWORD must be configured/
	);
	assert.equal(database.calls.some(({ sql }) => sql.includes('INSERT INTO users')), false);
});

test('creates a development administrator with a hashed default password', async () => {
	const database = createDatabase();

	await ensureAdminAccount(database, { NODE_ENV: 'development' });

	const insert = database.calls.find(({ sql }) => sql.includes('INSERT INTO users'));
	assert.ok(insert);
	assert.equal(insert.values[0], 'Administrator');
	assert.equal(insert.values[1], 'admin');
	assert.equal(insert.values[4], 17);
	assert.equal(await bcrypt.compare('admin@123', insert.values[3]), true);
});
