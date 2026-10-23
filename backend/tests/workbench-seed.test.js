const assert = require('node:assert/strict');
const { test } = require('node:test');

const seedWorkbenchData = require('../src/config/seedWorkbenchData');

function withNodeEnv(value, callback) {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = value;

    return Promise.resolve()
        .then(callback)
        .finally(() => {
            if (original === undefined) {
                delete process.env.NODE_ENV;
            } else {
                process.env.NODE_ENV = original;
            }
        });
}

test('does not create demo workbench data in production', async () => {
    let connectionRequested = false;
    const database = {
        async getConnection() {
            connectionRequested = true;
        }
    };

    await withNodeEnv('production', () => seedWorkbenchData(database));

    assert.equal(connectionRequested, false);
});

test('creates settings, sample orders, and kitchen tickets only once', async () => {
    const statements = [];
    let nextMenuItemId = 10;
    let nextTableId = 20;
    let nextOrderId = 30;
    let seedExists = false;
    let committed = false;
    let released = false;
    let rolledBack = false;

    const connection = {
        async beginTransaction() {},
        async commit() {
            committed = true;
        },
        async rollback() {
            rolledBack = true;
        },
        release() {
            released = true;
        },
        async execute(sql, values = []) {
            statements.push({ sql, values });

            if (sql.includes('INSERT IGNORE INTO app_seed_runs')) {
                if (seedExists) {
                    return [{ affectedRows: 0 }, []];
                }
                seedExists = true;
                return [{ affectedRows: 1 }, []];
            }
            if (sql.includes('SELECT id FROM menu_categories')) {
                return [[{ id: 1 }], []];
            }
            if (sql.includes('SELECT id FROM menu_items')) {
                return [[], []];
            }
            if (sql.includes('INSERT INTO menu_items')) {
                return [{ insertId: nextMenuItemId++ }, []];
            }
            if (sql.includes('INNER JOIN roles')) {
                return [[{ id: 7 }], []];
            }
            if (sql.includes('SELECT id FROM restaurant_tables')) {
                return [[{ id: nextTableId++ }], []];
            }
            if (sql.includes('INSERT INTO orders')) {
                return [{ insertId: nextOrderId++ }, []];
            }
            return [{ affectedRows: 1 }, []];
        }
    };

    const database = {
        async getConnection() {
            return connection;
        }
    };

    await withNodeEnv('development', () => seedWorkbenchData(database));
    await withNodeEnv('development', () => seedWorkbenchData(database));

    const settingStatements = statements.filter(({ sql }) =>
        sql.includes('INSERT IGNORE INTO settings')
    );
    const orderStatements = statements.filter(({ sql }) =>
        sql.includes('INSERT INTO orders')
    );
    const kitchenStatements = statements.filter(({ sql }) =>
        sql.includes('INSERT INTO kitchen_orders')
    );
    const kitchenStatuses = kitchenStatements.map(({ values }) => values[1]);

    assert.equal(settingStatements.length, 3);
    assert.deepEqual(
        settingStatements.map(({ values }) => values),
        [
            ['tax_rate', '0.00'],
            ['payment_methods', '["cash","card"]'],
            ['currency', 'USD']
        ]
    );
    assert.equal(orderStatements.length, 3);
    assert.equal(kitchenStatements.length, 3);
    assert.deepEqual(kitchenStatuses, ['pending', 'preparing', 'ready']);
    assert.equal(committed, true);
    assert.equal(rolledBack, false);
    assert.equal(released, true);
});
