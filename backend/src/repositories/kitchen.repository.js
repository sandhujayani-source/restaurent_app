const pool = require('../config/database');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

const KitchenRepository = {
	async findAll(status) {
		const values = [];
		const statusFilter = status ? 'WHERE ko.status = ?' : '';
		if (status) values.push(status);

		const [tickets] = await pool.execute(
			`SELECT ko.id, ko.order_id, ko.status, ko.notes,
					ko.started_at, ko.completed_at, ko.created_at, ko.updated_at,
					o.order_number, o.table_id, rt.table_number,
					o.created_by, u.full_name AS waiter_name, o.total_amount
			 FROM kitchen_orders ko
			 INNER JOIN orders o ON o.id = ko.order_id
			 LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
			 LEFT JOIN users u ON u.id = o.created_by
			 ${statusFilter}
			 ORDER BY FIELD(ko.status, 'pending', 'preparing', 'ready', 'completed', 'cancelled'),
					  ko.created_at ASC, ko.id ASC
			 LIMIT 200`,
			values
		);

		if (!tickets.length) return [];

		const orderIds = [...new Set(tickets.map(ticket => ticket.order_id))];
		const placeholders = orderIds.map(() => '?').join(', ');
		const [items] = await pool.execute(
			`SELECT oi.id, oi.order_id, oi.menu_item_id, mi.name AS menu_item_name,
					oi.quantity, oi.notes
			 FROM order_items oi
			 INNER JOIN menu_items mi ON mi.id = oi.menu_item_id
			 WHERE oi.order_id IN (${placeholders})
			 ORDER BY oi.id`,
			orderIds
		);
		const itemsByOrder = new Map();
		for (const item of items) {
			const orderItems = itemsByOrder.get(item.order_id) || [];
			orderItems.push(item);
			itemsByOrder.set(item.order_id, orderItems);
		}

		return tickets.map(ticket => ({
			...ticket,
			items: itemsByOrder.get(ticket.order_id) || []
		}));
	},

	async findById(id) {
		const [rows] = await pool.execute(
			`SELECT ko.id, ko.order_id, ko.status, ko.notes,
					ko.started_at, ko.completed_at, ko.created_at, ko.updated_at,
					o.order_number, o.table_id, rt.table_number,
					o.created_by, u.full_name AS waiter_name, o.total_amount
			 FROM kitchen_orders ko
			 INNER JOIN orders o ON o.id = ko.order_id
			 LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
			 LEFT JOIN users u ON u.id = o.created_by
			 WHERE ko.id = ?
			 LIMIT 1`,
			[id]
		);

		if (!rows.length) return null;

		const [items] = await pool.execute(
			`SELECT oi.id, oi.menu_item_id, mi.name AS menu_item_name,
					oi.quantity, oi.notes
			 FROM order_items oi
			 INNER JOIN menu_items mi ON mi.id = oi.menu_item_id
			 WHERE oi.order_id = ?
			 ORDER BY oi.id`,
			[rows[0].order_id]
		);

		return { ...rows[0], items };
	},

	async updateStatus(id, status) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();
			const [tickets] = await connection.execute(
				`SELECT ko.id, ko.order_id, ko.status AS kitchen_status,
						o.status AS order_status
				 FROM kitchen_orders ko
				 INNER JOIN orders o ON o.id = ko.order_id
				 WHERE ko.id = ?
				 FOR UPDATE`,
				[id]
			);
			const ticket = tickets[0];

			if (!ticket) throw createError('Kitchen ticket not found.', 404);

			const isPreparing =
				ticket.kitchen_status === 'pending' && status === 'preparing';
			const isReady =
				ticket.kitchen_status === 'preparing' && status === 'ready';
			if (!isPreparing && !isReady) {
				throw createError(
					`Cannot change kitchen ticket from ${ticket.kitchen_status} to ${status}.`,
					409
				);
			}

			const orderStatus = isPreparing ? 'preparing' : 'ready';
			await connection.execute(
				`UPDATE kitchen_orders
				 SET status = ?,
					 started_at = CASE WHEN ? = 'preparing' THEN CURRENT_TIMESTAMP ELSE started_at END,
					 completed_at = CASE WHEN ? = 'ready' THEN CURRENT_TIMESTAMP ELSE completed_at END
				 WHERE id = ?`,
				[status, status, status, id]
			);
			await connection.execute(
				'UPDATE orders SET status = ? WHERE id = ?',
				[orderStatus, ticket.order_id]
			);

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

module.exports = KitchenRepository;

