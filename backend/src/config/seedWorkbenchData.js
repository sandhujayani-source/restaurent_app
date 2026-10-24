const pool = require('./database');

const DEMO_MENU_ITEMS = [
    { name: 'Workbench Demo Meal', price: '12.50' },
    { name: 'Workbench Demo Drink', price: '3.50' }
];

const DEMO_ORDERS = [
    { number: 'DEMO-ORD-001', status: 'pending', tableNumber: 'Demo 1', itemIndex: 0 },
    { number: 'DEMO-ORD-002', status: 'preparing', tableNumber: 'Demo 2', itemIndex: 1 },
    { number: 'DEMO-ORD-003', status: 'ready', tableNumber: 'Demo 3', itemIndex: 0 }
];

async function seedWorkbenchData(database = pool) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }

    const connection = await database.getConnection();

    try {
        await connection.beginTransaction();

        const [seedResult] = await connection.execute(
            'INSERT IGNORE INTO app_seed_runs (seed_name) VALUES (?)',
            ['workbench-demo-v1']
        );

        if (seedResult.affectedRows === 0) {
            await connection.commit();
            return;
        }

        const settings = [
            ['tax_rate', '0.00'],
            ['payment_methods', JSON.stringify(['cash', 'card'])],
            ['currency', 'USD']
        ];
        for (const [key, value] of settings) {
            await connection.execute(
                'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)',
                [key, value]
            );
        }

        await connection.execute(
            `INSERT IGNORE INTO menu_categories (name, description)
             VALUES (?, ?)`,
            ['Workbench Demo', 'Sample items for the demo workbench']
        );
        const [categories] = await connection.execute(
            'SELECT id FROM menu_categories WHERE name = ? LIMIT 1',
            ['Workbench Demo']
        );
        const categoryId = categories[0]?.id;
        if (!categoryId) {
            throw new Error('Unable to find the workbench demo menu category.');
        }

        const menuItemIds = [];
        for (const item of DEMO_MENU_ITEMS) {
            const [existingItems] = await connection.execute(
                `SELECT id FROM menu_items
                 WHERE category_id = ? AND name = ?
                 LIMIT 1`,
                [categoryId, item.name]
            );
            if (existingItems[0]) {
                menuItemIds.push(existingItems[0].id);
                continue;
            }

            const [itemResult] = await connection.execute(
                `INSERT INTO menu_items (category_id, name, description, price, is_available)
                 VALUES (?, ?, ?, ?, 1)`,
                [categoryId, item.name, 'Sample item for demo orders', item.price]
            );
            menuItemIds.push(itemResult.insertId);
        }

        const [admins] = await connection.execute(
            `SELECT u.id
             FROM users u
             INNER JOIN roles r ON r.id = u.role_id
             WHERE LOWER(r.role_name) = 'admin'
             ORDER BY u.id
             LIMIT 1`
        );
        const adminId = admins[0]?.id;
        if (!adminId) {
            throw new Error('Unable to find an administrator for demo workbench orders.');
        }

        const tables = new Map();
        for (const { tableNumber } of DEMO_ORDERS) {
            await connection.execute(
                `INSERT IGNORE INTO restaurant_tables (table_number, capacity, status, is_active)
                 VALUES (?, 2, 'occupied', 1)`,
                [tableNumber]
            );
            const [tableRows] = await connection.execute(
                'SELECT id FROM restaurant_tables WHERE table_number = ? LIMIT 1',
                [tableNumber]
            );
            const tableId = tableRows[0]?.id;
            if (!tableId) {
                throw new Error(`Unable to find demo table ${tableNumber}.`);
            }
            tables.set(tableNumber, tableId);
        }

        for (const demoOrder of DEMO_ORDERS) {
            const { number, status, tableNumber, itemIndex } = demoOrder;
            const itemId = menuItemIds[itemIndex];
            const item = DEMO_MENU_ITEMS[itemIndex];
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (
                    order_number, table_id, created_by, status, total_amount, notes
                 ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    number,
                    tables.get(tableNumber),
                    adminId,
                    status,
                    item.price,
                    'DEMO DATA - Sample workbench order'
                ]
            );

            await connection.execute(
                `INSERT INTO order_items (
                    order_id, menu_item_id, quantity, unit_price, subtotal, notes
                 ) VALUES (?, ?, 1, ?, ?, NULL)`,
                [orderResult.insertId, itemId, item.price, item.price]
            );

            await connection.execute(
                `INSERT INTO kitchen_orders (
                    order_id, status, notes,
                    started_at, completed_at
                 ) VALUES (
                    ?, ?, ?,
                    CASE WHEN ? IN ('preparing', 'ready') THEN CURRENT_TIMESTAMP ELSE NULL END,
                    CASE WHEN ? = 'ready' THEN CURRENT_TIMESTAMP ELSE NULL END
                 )`,
                [
                    orderResult.insertId,
                    status,
                    'DEMO DATA - Sample kitchen ticket',
                    status,
                    status
                ]
            );
        }

        await connection.commit();
        console.log('Created demo workbench data for orders, kitchen, and settings.');
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = seedWorkbenchData;
