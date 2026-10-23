const crypto = require('node:crypto');
const pool = require('../config/database');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function priceToCents(price) {
	const [whole, fraction = ''] = String(price).split('.');
	return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

function centsToPrice(cents) {
	return (cents / 100).toFixed(2);
}

async function getOrderDetails(executor, id) {
	const [orders] = await executor.execute(
		`SELECT o.id, o.order_number, o.table_id, rt.table_number,
				o.created_by, u.full_name AS waiter_name, o.status,
				o.total_amount, o.notes, o.created_at, o.updated_at
		 FROM orders o
		 LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
		 LEFT JOIN users u ON u.id = o.created_by
		 WHERE o.id = ?
		 LIMIT 1`,
		[id]
	);

	if (!orders.length) {
		return null;
	}

	const [items] = await executor.execute(
		`SELECT oi.id, oi.menu_item_id, mi.name AS menu_item_name,
				oi.quantity, oi.unit_price, oi.subtotal, oi.notes
		 FROM order_items oi
		 INNER JOIN menu_items mi ON mi.id = oi.menu_item_id
		 WHERE oi.order_id = ?
		 ORDER BY oi.id`,
		[id]
	);
	const [kitchenOrders] = await executor.execute(
		`SELECT id, status, notes, started_at, completed_at, created_at, updated_at
		 FROM kitchen_orders
		 WHERE order_id = ?
		 ORDER BY id`,
		[id]
	);

	return { ...orders[0], items, kitchenOrders };
}

const OrderRepository = {
	async findAll({ status, tableId, createdBy }) {
		const conditions = [];
		const values = [];

		if (status) {
			conditions.push('o.status = ?');
			values.push(status);
		}
		if (tableId !== undefined) {
			conditions.push('o.table_id = ?');
			values.push(tableId);
		}
		if (createdBy !== undefined) {
			conditions.push('o.created_by = ?');
			values.push(createdBy);
		}

		const whereClause = conditions.length
			? `WHERE ${conditions.join(' AND ')}`
			: '';
		const [rows] = await pool.execute(
			`SELECT o.id, o.order_number, o.table_id, rt.table_number,
					o.created_by, u.full_name AS waiter_name, o.status,
					o.total_amount, o.notes, o.created_at, o.updated_at,
					(SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
			 FROM orders o
			 LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
			 LEFT JOIN users u ON u.id = o.created_by
			 ${whereClause}
			 ORDER BY o.created_at DESC, o.id DESC
			 LIMIT 200`,
			values
		);

		return rows;
	},

	async findById(id) {
		return getOrderDetails(pool, id);
	},

	async findByIdempotencyKey(idempotencyKey) {
		const [rows] = await pool.execute(
			'SELECT id, request_hash FROM orders WHERE idempotency_key = ? LIMIT 1',
			[idempotencyKey]
		);

		return rows[0] || null;
	},

	async createOrder({ tableId, userId, notes, items, idempotencyKey, requestHash }) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();

			if (idempotencyKey) {
				const [existingOrders] = await connection.execute(
					'SELECT id, request_hash FROM orders WHERE idempotency_key = ? FOR UPDATE',
					[idempotencyKey]
				);

				if (existingOrders.length) {
					if (existingOrders[0].request_hash !== requestHash) {
						throw createError(
							'Idempotency-Key was already used with a different order request.',
							409
						);
					}

					await connection.commit();
					return { id: existingOrders[0].id, replayed: true };
				}
			}

			if (tableId !== null) {
				const [tables] = await connection.execute(
					`SELECT id, status, is_active
					 FROM restaurant_tables
					 WHERE id = ?
					 FOR UPDATE`,
					[tableId]
				);

				if (!tables.length || !tables[0].is_active) {
					throw createError('Active table not found.', 404);
				}
				if (tables[0].status !== 'available') {
					throw createError('Table is not available for a new order.', 409);
				}
			}

			const itemIds = items.map(item => item.menuItemId);
			const placeholders = itemIds.map(() => '?').join(', ');
			const [menuItems] = await connection.execute(
				`SELECT id, price, is_available
				 FROM menu_items
				 WHERE id IN (${placeholders})
				 FOR UPDATE`,
				itemIds
			);
			const menuById = new Map(menuItems.map(item => [Number(item.id), item]));

			if (menuById.size !== itemIds.length) {
				throw createError('One or more menu items do not exist.', 400);
			}
			if (menuItems.some(item => !item.is_available)) {
				throw createError('One or more menu items are unavailable.', 409);
			}

			const pricedItems = items.map(item => {
				const menuItem = menuById.get(item.menuItemId);
				const unitPriceCents = priceToCents(menuItem.price);
				const subtotalCents = unitPriceCents * item.quantity;
				return {
					...item,
					unitPrice: centsToPrice(unitPriceCents),
					subtotal: centsToPrice(subtotalCents),
					subtotalCents
				};
			});
			const totalCents = pricedItems.reduce(
				(total, item) => total + item.subtotalCents,
				0
			);

			if (totalCents > 9999999999) {
				throw createError('Order total exceeds the supported amount.', 400);
			}

			const orderNumber = `ORD-${crypto.randomUUID()}`;
			const [orderResult] = await connection.execute(
				`INSERT INTO orders (
					order_number, table_id, created_by, status, total_amount,
					notes, idempotency_key, request_hash
				) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
				[
					orderNumber,
					tableId,
					userId,
					centsToPrice(totalCents),
					notes,
					idempotencyKey,
					requestHash
				]
			);

			for (const item of pricedItems) {
				await connection.execute(
					`INSERT INTO order_items (
						order_id, menu_item_id, quantity, unit_price, subtotal, notes
					) VALUES (?, ?, ?, ?, ?, ?)`,
					[
						orderResult.insertId,
						item.menuItemId,
						item.quantity,
						item.unitPrice,
						item.subtotal,
						item.notes
					]
				);
			}

			await connection.execute(
				`INSERT INTO kitchen_orders (order_id, status, notes)
				 VALUES (?, 'pending', ?)`,
				[orderResult.insertId, notes]
			);

			if (tableId !== null) {
				const [tableUpdate] = await connection.execute(
					`UPDATE restaurant_tables
					 SET status = 'occupied'
					 WHERE id = ? AND is_active = 1 AND status = 'available'`,
					[tableId]
				);
				if (tableUpdate.affectedRows !== 1) {
					throw createError('Table is no longer available.', 409);
				}
			}

			await connection.commit();
			return { id: orderResult.insertId, replayed: false };
		} catch (error) {
			await connection.rollback();

			if (error.code === 'ER_DUP_ENTRY' && idempotencyKey) {
				const existing = await this.findByIdempotencyKey(idempotencyKey);
				if (existing?.request_hash === requestHash) {
					return { id: existing.id, replayed: true };
				}
				if (existing) {
					throw createError(
						'Idempotency-Key was already used with a different order request.',
						409
					);
				}
			}

			throw error;
		} finally {
			connection.release();
		}
	},

	async updateStatus(id, { status, userId, role }) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();
			const [orders] = await connection.execute(
				`SELECT id, table_id, created_by, status
				 FROM orders
				 WHERE id = ?
				 FOR UPDATE`,
				[id]
			);
			const order = orders[0];

			if (!order) {
				throw createError('Order not found.', 404);
			}

			if (
				role.toLowerCase() === 'waiter' &&
				Number(order.created_by) !== Number(userId)
			) {
				throw createError('Order not found.', 404);
			}

			const isAdmin = role.toLowerCase() === 'admin';
			const canCancel = status === 'cancelled' && (
				order.status === 'pending' ||
				(isAdmin && order.status === 'preparing')
			);
			const canComplete = status === 'completed' && order.status === 'ready';

			if (!canCancel && !canComplete) {
				throw createError(
					`Cannot change order status from ${order.status} to ${status}.`,
					409
				);
			}

			await connection.execute(
				'UPDATE orders SET status = ? WHERE id = ?',
				[status, id]
			);
			await connection.execute(
				`UPDATE kitchen_orders
				 SET status = ?, completed_at = CURRENT_TIMESTAMP
				 WHERE order_id = ? AND status NOT IN ('completed', 'cancelled')`,
				[status, id]
			);

			if (order.table_id !== null) {
				const [activeOrders] = await connection.execute(
					`SELECT COUNT(*) AS count
					 FROM orders
					 WHERE table_id = ?
					   AND id <> ?
					   AND status NOT IN ('completed', 'cancelled')`,
					[order.table_id, id]
				);

				if (Number(activeOrders[0].count) === 0) {
					await connection.execute(
						`UPDATE restaurant_tables
						 SET status = 'available'
						 WHERE id = ? AND is_active = 1`,
						[order.table_id]
					);
				}
			}

			await connection.commit();
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}

		return this.findById(id);
	}
};

module.exports = OrderRepository;

