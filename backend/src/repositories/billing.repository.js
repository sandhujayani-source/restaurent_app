const crypto = require('node:crypto');
const pool = require('../config/database');

function toCents(value) {
	const [whole, fraction = ''] = String(value).split('.');
	return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

function toAmount(cents) {
	return (cents / 100).toFixed(2);
}

async function getBillDetails(executor, billId) {
	const [bills] = await executor.execute(
		`SELECT b.id, b.bill_number, b.order_id, o.order_number,
				o.table_id, rt.table_number, o.created_by, b.subtotal,
				b.tax_amount, b.discount_amount, b.total_amount,
				b.status, b.issued_at
		 FROM bills b
		 INNER JOIN orders o ON o.id = b.order_id
		 LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
		 WHERE b.id = ?
		 LIMIT 1`,
		[billId]
	);
	if (!bills.length) return null;

	const [items] = await executor.execute(
		`SELECT oi.id, oi.menu_item_id, mi.name AS menu_item_name,
				oi.quantity, oi.unit_price, oi.subtotal, oi.notes
		 FROM order_items oi
		 INNER JOIN menu_items mi ON mi.id = oi.menu_item_id
		 WHERE oi.order_id = ?
		 ORDER BY oi.id`,
		[bills[0].order_id]
	);
	const [payments] = await executor.execute(
		`SELECT id, payment_method, amount, transaction_reference, status, paid_at
		 FROM payments
		 WHERE bill_id = ?
		 ORDER BY paid_at, id`,
		[billId]
	);

	return { ...bills[0], items, payments };
}

const BillingRepository = {
	async findById(id) {
		return getBillDetails(pool, id);
	},

	async findByOrderId(orderId) {
		const [rows] = await pool.execute(
			'SELECT id FROM bills WHERE order_id = ? LIMIT 1',
			[orderId]
		);
		return rows[0] ? getBillDetails(pool, rows[0].id) : null;
	},

	async createFromOrder(orderId, taxRate, user) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();
			const [orders] = await connection.execute(
				`SELECT id, order_number, status, created_by
				 FROM orders
				 WHERE id = ?
				 FOR UPDATE`,
				[orderId]
			);
			const order = orders[0];
			if (!order) {
				const error = new Error('Order not found.');
				error.statusCode = 404;
				throw error;
			}
			if (
				String(user.role).toLowerCase() === 'waiter' &&
				Number(order.created_by) !== Number(user.userId)
			) {
				const error = new Error('Order not found.');
				error.statusCode = 404;
				throw error;
			}

			const [existingBills] = await connection.execute(
				'SELECT id FROM bills WHERE order_id = ? LIMIT 1',
				[orderId]
			);
			if (existingBills.length) {
				await connection.commit();
				return { id: existingBills[0].id, created: false };
			}

			if (!['ready', 'completed'].includes(order.status)) {
				const error = new Error('A bill can only be generated for a ready order.');
				error.statusCode = 409;
				throw error;
			}

			const [totals] = await connection.execute(
				`SELECT COALESCE(SUM(subtotal), 0) AS subtotal
				 FROM order_items
				 WHERE order_id = ?`,
				[orderId]
			);
			const subtotalCents = toCents(totals[0].subtotal);
			if (subtotalCents <= 0) {
				const error = new Error('Order has no billable items.');
				error.statusCode = 409;
				throw error;
			}

			const taxBasisPoints = Math.round(taxRate * 100);
			const taxCents = Math.round(subtotalCents * taxBasisPoints / 10000);
			const totalCents = subtotalCents + taxCents;
			if (totalCents > 9999999999) {
				const error = new Error('Bill total exceeds the supported amount.');
				error.statusCode = 400;
				throw error;
			}

			const billNumber = `BILL-${crypto.randomUUID()}`;
			const [result] = await connection.execute(
				`INSERT INTO bills (
					bill_number, order_id, subtotal, tax_amount,
					discount_amount, total_amount, status
				) VALUES (?, ?, ?, ?, '0.00', ?, 'unpaid')`,
				[
					billNumber,
					orderId,
					toAmount(subtotalCents),
					toAmount(taxCents),
					toAmount(totalCents)
				]
			);

			await connection.commit();
			return { id: result.insertId, created: true };
		} catch (error) {
			await connection.rollback();
			if (error.code === 'ER_DUP_ENTRY') {
				const [existingBills] = await connection.execute(
					'SELECT id FROM bills WHERE order_id = ? LIMIT 1',
					[orderId]
				);
				if (existingBills.length) {
					return { id: existingBills[0].id, created: false };
				}
			}
			throw error;
		} finally {
			connection.release();
		}
	}
};

module.exports = BillingRepository;

